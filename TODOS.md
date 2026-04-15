# 📋 Engineering Roadmap & Technical Backlog (TODOs)

This document tracks all planned features, architectural improvements, technical debt, and pending enhancements across the **OmniDoc Intelligence Hub** platform.

---

## 🎯 High-Priority Enhancements (Core RAG & Retrieval)

### 1. Conversational Coreference Resolution & Multi-Turn Query Rewriting
- **Problem**: Follow-up questions with pronouns (e.g. *"who is his friend"*, *"what are its terms"*) lack context during single-turn vector embedding search, resulting in premature abstentions.
- **Proposed Solution**: 
  - Introduce a lightweight query rewriting step using the LLM before vector retrieval.
  - Given the recent conversation history ($N=3$ turns) and user prompt, generate a standalone, de-referenced query (e.g. *"who is Dhaval Patel's co-founder at Codebasics"*).
- **Files to Modify**: `backend/rag/service.py`, `backend/api/routers/rag.py`
- **Status**: `[ ] Planned` | **Priority**: `P0 - High`

### 2. Hybrid Search (Sparse BM25 + Dense Semantic Embeddings)
- **Problem**: Dense embeddings can occasionally miss exact keyword identifiers, policy codes (`POL-2026-EXP`), and exact legal section numbers.
- **Proposed Solution**:
  - Implement Reciprocal Rank Fusion (RRF) combining BM25 keyword matching with ChromaDB dense vector similarity (`bge-m3`).
- **Files to Modify**: `backend/retrieval/indexer.py`, `backend/retrieval/hybrid.py`
- **Status**: `[ ] Planned` | **Priority**: `P1 - High`

### 3. Cross-Encoder Reranker Integration
- **Problem**: Cosine similarity on bi-encoder embeddings can have minor ranking noise when dealing with similar policy passages.
- **Proposed Solution**:
  - Add a fast local cross-encoder reranker (e.g., `BAAI/bge-reranker-base` or `ms-marco-MiniLM-L-6-v2`) to re-score the Top-10 retrieved candidate chunks before feeding Top-3 into the LLM prompt.
- **Files to Modify**: `backend/retrieval/reranker.py`, `backend/rag/service.py`
- **Status**: `[ ] Planned` | **Priority**: `P1 - High`

---

## ⚡ Backend Architecture & Asynchronous Scaling

### 4. Asynchronous Task Worker for Heavy PDF Ingestion
- **Problem**: Large 100+ page scanned documents processed synchronously via `POST /api/v1/ingest/upload` can block HTTP workers or risk connection timeouts.
- **Proposed Solution**:
  - Offload extraction, OCR, and vectorization to a background worker (Celery, ARQ, or Redis Queue).
  - Endpoint immediately returns `{"task_id": "...", "status": "queued"}` with a progress polling endpoint `GET /api/v1/ingest/tasks/{task_id}`.
- **Files to Modify**: `backend/api/routers/ingest.py`, `backend/tasks/worker.py`
- **Status**: `[ ] Planned` | **Priority**: `P1 - High`

### 5. Real-Time Streaming RAG Generation (Server-Sent Events)
- **Problem**: Answers are returned in a single batch response after the LLM completes generation (~2-5s).
- **Proposed Solution**:
  - Implement SSE (Server-Sent Events) endpoint `POST /api/v1/rag/stream` to stream tokens in real-time to the React frontend.
- **Files to Modify**: `backend/api/routers/rag.py`, `frontend/src/components/ChatArea.tsx`
- **Status**: `[ ] Planned` | **Priority**: `P1 - Medium`

### 6. Full SQLite Relational Synchronization in Ingest Route
- **Problem**: `/api/v1/ingest/upload` stores chunks in ChromaDB and returns metadata, but does not yet commit the SQLAlchemy `DocumentRecord`, `DocumentVersion`, `Page`, and `Chunk` ORM models into SQLite.
- **Proposed Solution**:
  - Connect `get_db` session in `ingest.py` to persist relational entities with foreign keys and SHA-256 deduplication.
- **Files to Modify**: `backend/api/routers/ingest.py`, `backend/database/models.py`
- **Status**: `[ ] Planned` | **Priority**: `P1 - Medium`

### 7. Document Deletion & Purge API
- **Problem**: Ingested documents cannot be dynamically deleted via API.
- **Proposed Solution**:
  - Add `DELETE /api/v1/docs/{document_id}` to delete ChromaDB vectors where `document_id == id` and cascade-delete SQLite records.
- **Files to Modify**: `backend/api/routers/documents.py`, `backend/retrieval/indexer.py`
- **Status**: `[ ] Planned` | **Priority**: `P2 - Medium`

---

## 🎨 Frontend & User Experience (React + TypeScript)

### 8. Multi-File Batch Drag-and-Drop Ingestion
- **Enhancement**: Allow users to drag and drop multiple PDF files simultaneously in `IngestPolicyModal.tsx` with individual progress bars.
- **Files to Modify**: `frontend/src/components/IngestPolicyModal.tsx`
- **Status**: `[ ] Planned` | **Priority**: `P2 - Medium`

### 9. Dark / Light Theme Toggle & Workspace Personalization
- **Enhancement**: Provide a persistent theme toggle (Tailwind dark/light mode) and custom system prompt editor in Pipeline Settings.
- **Files to Modify**: `frontend/src/components/Header.tsx`, `frontend/src/components/PipelineSettings.tsx`
- **Status**: `[ ] Planned` | **Priority**: `P3 - Low`

---

## 🧪 Testing & Observability

### 10. Automated End-to-End Browser Testing (Playwright / Cypress)
- **Enhancement**: Add Playwright test suite to validate UI file upload, citation modal opening, and live chat query rendering in CI.
- **Files to Modify**: `tests/e2e/test_frontend.py` or `frontend/e2e/`
- **Status**: `[ ] Planned` | **Priority**: `P2 - Medium`

### 11. Multi-Language OCR Expansion (Tesseract Hindi/Devanagari Pack)
- **Enhancement**: Install `tesseract-ocr-hin` on host/Docker environment to support bilingual English/Hindi document scans natively.
- **Files to Modify**: `backend/ingestion/document_processor.py`, `Dockerfile`
- **Status**: `[ ] Planned` | **Priority**: `P2 - Medium`

---

## 📊 Summary Matrix

| ID | Module | Title | Priority | Complexity |
|---|---|---|---|---|
| **TODO-01** | `RAG Engine` | Conversational Coreference Query Rewriting | **P0** | Moderate |
| **TODO-02** | `Retrieval` | Hybrid Search (BM25 + ChromaDB RRF) | **P1** | Moderate |
| **TODO-03** | `Retrieval` | Cross-Encoder Reranker (`bge-reranker`) | **P1** | Low |
| **TODO-04** | `Ingestion` | Asynchronous Celery / Redis Task Queue | **P1** | Moderate |
| **TODO-05** | `API / Frontend` | Token Streaming via Server-Sent Events (SSE) | **P1** | Low |
| **TODO-06** | `Database` | SQLite Relational Session Persistence on Upload | **P1** | Low |
| **TODO-07** | `API` | Document Deletion & Vector Purge (`DELETE /docs/{id}`) | **P2** | Low |
| **TODO-08** | `Frontend` | Multi-File Batch PDF Ingestion UI | **P2** | Moderate |
| **TODO-09** | `Frontend` | Theme Toggle & Prompt Configuration | **P3** | Low |
| **TODO-10** | `Testing` | Playwright E2E Integration Suite | **P2** | Moderate |
| **TODO-11** | `Ingestion` | Bilingual Hindi/Devanagari OCR Pack | **P2** | Low |
