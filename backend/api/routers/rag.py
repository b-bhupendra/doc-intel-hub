# backend/api/routers/rag.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import time

from backend.rag.service import GroundedRAGService, RAGResponse
from backend.core.logging import get_logger

logger = get_logger("RAGRouter")
router = APIRouter()

# Dependency Injection for the RAG Service
def get_rag_service():
    return GroundedRAGService()

class QueryRequest(BaseModel):
    query: str

@router.post("/query", response_model=RAGResponse)
def query_policy_documents(request: QueryRequest, service: GroundedRAGService = Depends(get_rag_service)):
    """
    Accepts a natural language query, performs semantic search, and returns a grounded answer with citations.
    """
    logger.info(f"API received query: {request.query}")
    start_time = time.time()
    
    try:
        # Execute the orchestration pipeline from Phase 5
        response = service.execute_query(request.query)
        
        # Calculate execution latency for observability
        response.latency_seconds = round(time.time() - start_time, 2)
        return response
        
    except Exception as e:
        logger.error(f"RAG execution failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during RAG generation.")
