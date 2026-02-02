# backend/rag/service.py
from typing import List, Optional
from pydantic import BaseModel, Field

class Citation(BaseModel):
    document_title: str
    version_id: str
    chunk_id: str
    chunk_index: int
    content: str
    similarity_score: Optional[float] = None

class RAGResponse(BaseModel):
    query: str
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    latency_seconds: float = 0.0
    is_grounded: bool = True
