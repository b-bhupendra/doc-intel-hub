# backend/retrieval/embedding_service.py
from abc import ABC, abstractmethod
from typing import List
import requests
from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger("EmbeddingFactory")


# 1. The Abstract Base Class (The Contract)
class BaseEmbeddingService(ABC):
    @abstractmethod
    def embed_query(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass


# 2. The Offline Implementation (Ollama)
class OllamaEmbeddingService(BaseEmbeddingService):
    def __init__(self):
        self.model_name = settings.OFFLINE_EMBEDDING_MODEL
        self.api_url = f"{settings.OLLAMA_BASE_URL}/api/embeddings"
        logger.info(f"Initialized Ollama Embedding Service with model: {self.model_name}")

    def embed_query(self, text: str) -> List[float]:
        try:
            response = requests.post(
                self.api_url,
                json={"model": self.model_name, "prompt": text},
                timeout=30
            )
            response.raise_for_status()
            return response.json()["embedding"]
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate Ollama embedding: {e}")
            raise

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_query(t) for t in texts]


# 3. The Cloud Implementation (Cohere)
class CloudEmbeddingService(BaseEmbeddingService):
    def __init__(self):
        import cohere
        if not settings.COHERE_API_KEY:
            logger.warning("COHERE_API_KEY is not configured in .env; cloud embeddings may fail.")
        self.client = cohere.Client(api_key=settings.COHERE_API_KEY)
        self.model = settings.CLOUD_EMBEDDING_MODEL
        logger.info(f"Initialized Cloud Cohere Embedding Service with model: {self.model}")

    def embed_query(self, text: str) -> List[float]:
        try:
            res = self.client.embed(
                texts=[text],
                model=self.model,
                input_type="search_query"
            )
            return res.embeddings[0]
        except Exception as e:
            logger.error(f"Failed to generate Cohere query embedding: {e}")
            raise

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        try:
            res = self.client.embed(
                texts=texts,
                model=self.model,
                input_type="search_document"
            )
            return res.embeddings
        except Exception as e:
            logger.error(f"Failed to generate Cohere documents embedding: {e}")
            raise


# 4. The Factory Router
def get_embedding_service() -> BaseEmbeddingService:
    """
    Factory router that dynamically provides the active embedding service based on AI_MODE.
    """
    if settings.AI_MODE == "cloud":
        logger.info("Factory Router: Initializing CLOUD Embeddings (Cohere)")
        return CloudEmbeddingService()
    else:
        logger.info("Factory Router: Initializing OFFLINE Embeddings (Ollama)")
        return OllamaEmbeddingService()
