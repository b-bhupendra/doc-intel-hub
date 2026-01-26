# backend/retrieval/embedding_service.py
from abc import ABC, abstractmethod
from typing import List
import requests
from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger("EmbeddingService")

class BaseEmbeddingService(ABC):
    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass
        
    @abstractmethod
    def embed_query(self, text: str) -> List[float]:
        pass

class OllamaEmbeddingService(BaseEmbeddingService):
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.api_url = f"{settings.OLLAMA_BASE_URL}/api/embeddings"
        logger.info(f"Initialized Ollama Embedding Service with model: {self.model_name}")

    def embed_query(self, text: str) -> List[float]:
        try:
            response = requests.post(self.api_url, json={"model": self.model_name, "prompt": text})
            response.raise_for_status()
            return response.json()["embedding"]
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_query(t) for t in texts]
