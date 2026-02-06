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
        logger.info(f"Initialized GroundedRAGService with model: {self.generation_model}")

    def retrieve_relevant_chunks(self, query: str, top_k: Optional[int] = None) -> List[Citation]:
        """
        Embeds user query, performs vector search against ChromaDB, and returns ranked citations.
        """
        k = top_k or settings.TOP_K_CHUNKS
        query_embedding = self.embedding_service.embed_query(query)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"]
        )

        citations = []
        if not results or not results["documents"] or not results["documents"][0]:
            logger.warning(f"No vector matches found for query: {query}")
            return citations

        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(documents)

        for doc, meta, dist in zip(documents, metadatas, distances):
            # For cosine distance in Chroma: similarity = 1.0 - distance
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

        logger.info(f"Retrieved {len(citations)} chunks above similarity threshold {settings.SIMILARITY_RELEVANCE_THRESHOLD}")
        return citations

    def generate_grounded_answer(self, query: str, citations: List[Citation]) -> str:
        """
        Synthesizes a response using Ollama LLM strictly grounded on retrieved context citations.
        """
        if not citations:
            return "I could not find relevant information in the enterprise documents to answer your query."

        context_blocks = []
        for idx, cite in enumerate(citations, 1):
            context_blocks.append(
                f"[{idx}] Source: {cite.document_title} (Chunk ID: {cite.chunk_id})\n{cite.content}"
            )
        context_str = "\n\n".join(context_blocks)

        system_prompt = (
            "You are an enterprise document intelligence assistant. "
            "Answer the user's question using ONLY the provided context citations below. "
            "If the context does not contain enough information, state that clearly. "
            "Cite your sources using [1], [2], etc., matching the provided context numbers.\n\n"
            f"Context:\n{context_str}\n\n"
            f"User Query: {query}"
        )

        try:
            response = requests.post(
                self.generation_url,
                json={
                    "model": self.generation_model,
                    "prompt": system_prompt,
                    "stream": False
                },
                timeout=60
            )
            response.raise_for_status()
            return response.json().get("response", "").strip()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate answer from Ollama LLM: {e}")
            raise

    def execute_query(self, query: str) -> RAGResponse:
        """
        Orchestrates semantic retrieval and grounded response generation.
        """
        citations = self.retrieve_relevant_chunks(query)
        answer = self.generate_grounded_answer(query, citations)

        return RAGResponse(
            query=query,
            answer=answer,
            citations=citations,
            is_grounded=len(citations) > 0
        )
