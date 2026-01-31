# backend/retrieval/indexer.py
import chromadb
from typing import List, Dict, Any
from backend.core.config import settings
from backend.core.logging import get_logger
from backend.retrieval.embedding_service import OllamaEmbeddingService

logger = get_logger("VectorIndexer")

class ChromaIndexer:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.embedding_service = OllamaEmbeddingService()
        
        # Get or create the collection for our document vectors
        self.collection = self.chroma_client.get_or_create_collection(
            name="enterprise_documents",
            metadata={"hnsw:space": "cosine"} # Cosine similarity is standard for text embeddings
        )
        logger.info(f"Connected to ChromaDB collection: 'enterprise_documents'")

    def index_chunks(self, document_title: str, version_id: str, chunks: List[Dict[str, Any]]):
        """
        Takes structured chunks, generates embeddings, and pushes them to ChromaDB.
        """
        if not chunks:
            logger.warning("No chunks provided for indexing.")
            return

        ids = []
        texts = []
        metadatas = []

        for chunk in chunks:
            vector_id = f"vec_{chunk['chunk_id']}"
            
            ids.append(vector_id)
            texts.append(chunk["content"])
            
            # This metadata allows for strict pre-filtering during RAG queries[cite: 1]
            metadatas.append({
                "document_title": document_title,
                "version_id": version_id,
                "chunk_id": chunk['chunk_id'],
                "chunk_index": chunk['chunk_index']
            })

        logger.debug(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = self.embedding_service.embed_documents(texts)

        logger.debug(f"Upserting {len(ids)} vectors into ChromaDB...")
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )
        logger.info(f"Successfully indexed {len(ids)} chunks for {document_title}.")
        
        return ids
