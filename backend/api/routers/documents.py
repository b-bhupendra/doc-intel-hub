# backend/api/routers/documents.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

# In a real setup, you would inject the SQLAlchemy session here.
# For this scaffold, we define the schema contract.

router = APIRouter()

class DocumentSummary(BaseModel):
    id: str
    title: str
    document_type: str
    version: int
    page_count: int

@router.get("/", response_model=List[DocumentSummary])
def list_ingested_documents():
    """
    Returns a list of all documents currently available in the canonical SQL database.
    (Placeholder for SQLAlchemy session query: session.query(DocumentRecord).all())
    """
    # Mock response demonstrating the data contract
    return [
        DocumentSummary(
            id="DOC-CORP-FIN-001", 
            title="Corporate Financial Guidelines", 
            document_type="Policy", 
            version=1, 
            page_count=42
        )
    ]
