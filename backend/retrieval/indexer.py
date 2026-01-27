# backend/retrieval/indexer.py
import chromadb
from backend.core.config import settings
from backend.core.logging import get_logger
from backend.retrieval.embedding_service import OllamaEmbeddingService

logger = get_logger("VectorIndexer")

class ChromaIndexer:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.embedding_service = OllamaEmbeddingService()
