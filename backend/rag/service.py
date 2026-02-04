# backend/rag/service.py
from typing import List, Optional
from pydantic import BaseModel, Field
import requests
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
        self.generation_url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        self.generation_model = settings.GENERATION_MODEL

    def retrieve_relevant_chunks(self, query: str, top_k: Optional[int] = None) -> List[Citation]:
        k = top_k or settings.TOP_K_CHUNKS
        query_embedding = self.embedding_service.embed_query(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"]
        )
        citations = []
        if not results or not results["documents"] or not results["documents"][0]:
            return citations

        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(documents)

        for doc, meta, dist in zip(documents, metadatas, distances):
            similarity = round(1.0 - float(dist), 4)
            if similarity >= settings.SIMILARITY_RELEVANCE_THRESHOLD:
                citations.append(Citation(
                    document_title=meta.get("document_title", "Unknown"),
                    version_id=meta.get("version_id", "v1"),
                    chunk_id=meta.get("chunk_id", "unknown"),
                    chunk_index=meta.get("chunk_index", 0),
                    content=doc,
                    similarity_score=similarity
                ))
        return citations
