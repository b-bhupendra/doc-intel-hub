# backend/api/routers/documents.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class DocumentSummary(BaseModel):
    id: str
    title: str
    document_type: str
    version: int
    page_count: int
