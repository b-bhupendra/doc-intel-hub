# backend/rag/service.py
from typing import List, Optional
from pydantic import BaseModel, Field
import chromadb

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.retrieval.embedding_service import OllamaEmbeddingService

logger = get_logger("GroundedRAGService")

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

class GroundedRAGService:
    def __init__(self):
        self.embedding_service = OllamaEmbeddingService()
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.collection = self.chroma_client.get_or_create_collection(
            name="enterprise_documents",
            metadata={"hnsw:space": "cosine"}
        )
