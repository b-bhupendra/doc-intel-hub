# backend/api/routers/rag.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.rag.service import GroundedRAGService, RAGResponse

router = APIRouter()

def get_rag_service():
    return GroundedRAGService()

class QueryRequest(BaseModel):
    query: str
