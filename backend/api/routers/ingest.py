# backend/api/routers/ingest.py
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
import hashlib
import os
import time
from typing import Dict, Any

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.ingestion.document_processor import DocumentUnderstandingService
from backend.retrieval.chunking import create_structure_aware_chunks
from backend.retrieval.indexer import ChromaIndexer

logger = get_logger("IngestionRouter")
router = APIRouter()

# Instantiate services
doc_service = DocumentUnderstandingService()
indexer = ChromaIndexer()


@router.post("/upload")
async def ingest_document(file: UploadFile = File(...)):
    """
    Accepts a PDF upload, hashes it for idempotency, extracts text via the 95/5 triage rule, 
    chunks the content, and indexes it into ChromaDB.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    start_time = time.time()
    file_bytes = await file.read()
    
    # 1. Idempotency Check (SHA-256)
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # (In a real implementation, you query your SQLAlchemy 'DocumentVersion' table here)
    # if db_session.query(DocumentVersion).filter_by(checksum_sha256=file_hash).first():
    #     raise HTTPException(status_code=409, detail="Document already exists in the system.")

    # 2. Save the file temporarily for PyMuPDF processing
    safe_filename = file.filename.replace(" ", "_")
    raw_dir = "/tmp/raw_pdfs" if settings.IS_VERCEL else "./data/raw_pdfs"
    os.makedirs(raw_dir, exist_ok=True)
    file_path = os.path.join(raw_dir, f"{file_hash[:8]}_{safe_filename}")
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    logger.info(f"File saved to {file_path}. Starting extraction...")

    try:
        # 3. Page-Level Extraction & OCR Triage (Phase 3)
        extracted_pages = doc_service.process_document(file_path)
        
        # 4. Structure-Aware Chunking (Phase 4)
        all_chunks = []
        for page in extracted_pages:
            # Generate deterministic IDs based on the hash and page number
            page_id = f"DOC-{file_hash[:8]}-P{page['page_number']:03d}"
            
            page_chunks = create_structure_aware_chunks(
                page_id=page_id,
                cleaned_text=page['cleaned_text']
            )
            all_chunks.extend(page_chunks)

        # 5. Vector Indexing
        logger.info(f"Pushing {len(all_chunks)} chunks to ChromaDB...")
        vector_ids = indexer.index_chunks(
            document_title=file.filename,
            version_id=file_hash[:8],
            chunks=all_chunks
        )

        # (Here you would commit the Document, Page, and Chunk records to your SQLAlchemy database)

        # 6. Return Telemetry
        processing_time = round(time.time() - start_time, 2)
        ocr_pages = sum(1 for p in extracted_pages if p['ocr_applied'])
        
        return {
            "status": "success",
            "filename": file.filename,
            "document_id": f"DOC-{file_hash[:8]}",
            "telemetry": {
                "total_pages": len(extracted_pages),
                "pages_requiring_ocr": ocr_pages,
                "total_chunks_generated": len(all_chunks),
                "processing_time_seconds": processing_time
            }
        }

    except Exception as e:
        logger.error(f"Ingestion failed for {file.filename}: {e}")
        # Clean up the file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))
