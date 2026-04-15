# 🏛️ Enterprise Document Intelligence & Policy Hub

An end-to-end, local-first Retrieval-Augmented Generation (RAG) platform designed for deterministic policy querying. Built to ingest complex government/corporate PDFs, handle multilingual OCR, and serve grounded answers with strict mathematical abstention to prevent AI hallucinations.

## 🚀 Key Features
* **Idempotent ETL Ingestion:** Page-level processing using PyMuPDF and SQLite tracking (via SQLAlchemy 2.0) with SHA-256 checksums to prevent duplicate ingestion.
* **Multimodal Triage Router (95/5 Rule):** Fast, deterministic extraction for digital text, selectively escalating to bilingual Tesseract OCR (`eng+hin`) only when page quality scores fall below `0.65`.
* **Grounded RAG & Strict Abstention:** Drops retrieved vectors below a 0.40 cosine distance threshold. If evidence is insufficient, the system abstains rather than hallucinating.
* **API Ecosystem:** Fully typed RESTful endpoints built with FastAPI, decoupling the AI orchestration from the frontend.
* **Operational Observability:** A Streamlit dashboard visualizing corpus health, OCR telemetry, and query latency.

## 🛠️ Tech Stack
* **Backend Framework:** FastAPI, Uvicorn, Pydantic
* **Database & Persistence:** SQLite, SQLAlchemy 2.0, Alembic
* **Vector Indexing:** ChromaDB
* **Data Processing & ETL:** Pandas, PyMuPDF (fitz), Pytesseract, Regex
* **AI Runtime:** Local Ollama (`llama3.2`, `bge-m3` for cross-lingual embeddings)
* **Frontend & Analytics:** Vanilla HTML/JS, Streamlit, Plotly

## ⚙️ Architecture Workflow
1. `DocumentUnderstandingService` splits PDFs into pages and scores native text quality.
2. Structure-aware chunking isolates policy clauses and attaches deterministic IDs.
3. Metadata is preserved in SQLite; embeddings are pushed to ChromaDB.
4. FastAPI exposes the `GroundedRAGService` for user queries.
5. The LLM generates answers strictly tethered to ChromaDB metadata citations.

## 🏁 Quickstart

### 1. Environment Setup
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Initialize AI Runtime

Ensure Ollama is running locally, then pull the required models:

```bash
ollama pull llama3.2:latest
ollama pull bge-m3:latest
```

### 3. Verify System Health & Start Services

```bash
# Run Preflight Checks
python -m backend.core.health

# Start the FastAPI Backend (serves API and built SPA)
uvicorn backend.api.main:app --reload --port 8000

# Start the React + Vite Frontend (Dev Mode)
cd frontend && npm run dev
```

### 4. Run Test Suite & Evaluation

```bash
# Run Unit and Integration Tests
pytest tests/ -v

# Run Retrieval Recall@K Evaluation
python -m tests.evaluation.evaluate_retrieval
```
