# tests/evaluation/evaluate_retrieval.py
import json
import chromadb
from backend.core.config import settings
from backend.retrieval.embedding_service import OllamaEmbeddingService


def evaluate_recall_at_k(k: int = 5) -> float:
    """
    Computes mathematical Recall@K against the curated ground truth evaluation set.
    """
    client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    collection = client.get_or_create_collection(name="enterprise_documents")
    embedder = OllamaEmbeddingService()
    
    with open("./data/evaluation/gold_set.json", "r") as f:
        gold_set = json.load(f)
        
    hits = 0
    for item in gold_set:
        vector = embedder.embed_query(item["question"])
        results = collection.query(query_embeddings=[vector], n_results=k)
        
        # Check if the expected chunk ID is in the retrieved metadata
        if results and results.get("metadatas") and results["metadatas"][0]:
            retrieved_ids = [meta["chunk_id"] for meta in results["metadatas"][0] if "chunk_id" in meta]
            if item["expected_chunk_id"] in retrieved_ids:
                hits += 1
            
    recall = hits / len(gold_set) if gold_set else 0.0
    print(f"Recall@{k}: {recall:.2%}")
    return recall


if __name__ == "__main__":
    evaluate_recall_at_k()
