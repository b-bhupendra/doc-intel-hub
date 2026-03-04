# tests/integration/test_api.py
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code in [200, 503]  # Depending on if Ollama is running locally during the test
    assert "status" in response.json()


def test_rag_query_endpoint_validation():
    # Test missing payload
    response = client.post("/api/v1/rag/query", json={})
    assert response.status_code == 422  # Pydantic validation error
    
    # Test valid payload structure
    # (In a real CI/CD pipeline, you would mock the GroundedRAGService here to avoid hitting the actual LLM)
    response = client.post("/api/v1/rag/query", json={"query": "Test query"})
    assert response.status_code == 200
    data = response.json()
    assert "abstained" in data or "is_grounded" in data


def test_ingest_upload_validation():
    # Test non-pdf rejection
    response = client.post(
        "/api/v1/ingest/upload",
        files={"file": ("test.txt", b"invalid file contents", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]

