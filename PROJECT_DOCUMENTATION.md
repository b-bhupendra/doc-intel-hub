# Enterprise Document Intelligence Platform (doc-intel-hub)
## Architecture & Project Session Documentation

---

## 1. Executive Summary & Project Purpose

**Doc-Intel-Hub** is an enterprise-grade Document Intelligence and Retrieval-Augmented Generation (RAG) platform. It processes unstructured documents (PDFs, scans, invoices) through quality-filtered extraction pipelines (PyMuPDF, Tesseract OCR), stores relational hierarchies and metadata in SQLite/SQLAlchemy, and bridges dense vector embeddings into ChromaDB for local LLM inference via Ollama (`llama3.2` and `bge-m3`).

---

## 2. Project Repository & Tech Stack

- **Repository**: [`b-bhupendra/doc-intel-hub`](https://github.com/b-bhupendra/doc-intel-hub)
- **Core Dependencies**:
  - **Core & Config**: `pydantic>=2.6.0`, `pydantic-settings>=2.2.0`, `python-dotenv>=1.0.0`
  - **Doc Processing & OCR**: `pymupdf>=1.23.0`, `pytesseract>=0.3.10`, `pillow>=10.2.0`
  - **Database & Migration**: `sqlalchemy>=2.0.25`, `alembic>=1.13.1`
  - **Vector Store & Retrieval**: `chromadb>=0.4.24`, `langchain-chroma>=0.1.0`, `langchain-core>=0.1.30`
  - **AI Engine**: Local Ollama (`llama3.2:latest`, `bge-m3:latest`)
  - **API Framework**: `fastapi>=0.110.0`, `uvicorn>=0.28.0`

---

## 3. Directory Layout & Skeleton

```
doc-intel-hub/
├── .env.example              # Template environment variables
├── .gitignore                # Ignores .venv, .env, *.log, data files, SQLite DBs
├── requirements.txt          # Frozen dependencies
├── PROJECT_DOCUMENTATION.md  # Comprehensive project architecture & history
├── backend/
│   ├── api/                  # FastAPI router endpoints
│   ├── core/
│   │   ├── config.py         # Central Pydantic BaseSettings
│   │   ├── health.py         # Directory & Ollama preflight check
│   │   └── logging.py        # Custom stream and file logger
│   ├── database/
│   │   ├── models.py         # SQLAlchemy 2.0 ORM Declarative Models
│   │   └── session.py        # Engine, event listeners & sessionmaker
│   ├── ingestion/            # PDF parsing & OCR quality pipelines
│   ├── rag/                  # Prompt engineering & LLM generation
│   └── retrieval/            # Vector store retrieval & reranking
├── data/
│   ├── chroma_db/            # ChromaDB persistent vector storage
│   ├── processed/            # Intermediate structured JSON/markdown
│   └── raw_pdfs/             # Source uploaded documents
└── tests/
    ├── unit/
    └── integration/
```

---

## 4. Git Commit Timeline & Milestones

The project history was structured and synchronized upstream to GitHub:

| Date | Commit Hash | Message & Scope |
| :--- | :--- | :--- |
| **01 Jan 2026** | `b494038` | `intital python env creation and skeleton of the app` |
| **05 Jan 2026** | `46db3ee` | `feat(core): implement central pydantic settings and environment configuration` |
| **05 Jan 2026** | `8b40c3c` | `feat(core): add structured logging module with file and stream handlers` |
| **05 Jan 2026** | `e691098` | `feat(core): add system preflight health checks for directories and ollama models` |
| **10 Jan 2026** | `51bfabc` | `feat(database): initialize SQLAlchemy declarative base and DocumentRecord model` |
| **10 Jan 2026** | `dc916f8` | `feat(database): add DocumentVersion model for version tracking and deduplication` |
| **10 Jan 2026** | `77ebbb6` | `feat(database): add Page model with OCR indicators and extraction quality metrics` |
| **10 Jan 2026** | `ab18a7b` | `feat(database): add Chunk model for semantic vector storage mapping` |
| **10 Jan 2026** | `f9c8d37` | `refactor(database): configure cascade delete-orphan policies across relational hierarchy` |
| **15 Jan 2026** | `a9ee9a6` | `feat(ingestion): initialize DocumentUnderstandingService structure and configuration` |
| **16 Jan 2026** | `c52830c` | `feat(ingestion): implement deterministic quality scoring based on character density` |
| **17 Jan 2026** | `7f39176` | `feat(ingestion): add document text sanitization and whitespace normalization` |
| **19 Jan 2026** | `3a87a9a` | `feat(ingestion): implement hybrid fast-path and Tesseract OCR escalation pipeline` |
| **20 Jan 2026** | `0c755bb` | `feat(ingestion): add full document ingestion loop and PyMuPDF import compatibility` |

---

## 5. Architectural Breakdown of Database Models (`backend/database/models.py`)

### The 4-Tier Relational Hierarchy

```
DocumentRecord (1)
  └── DocumentVersion (N) [Immutable Snapshot + Deduplication via SHA-256]
        └── Page (N) [OCR Auditing + Extraction Quality Score]
              └── Chunk (N) [Token Count + ChromaDB Vector Bridge]
```

### Entity Responsibilities

1. **`DocumentRecord`**:
   - Represents the logical document entity.
   - Holds high-level metadata: `title`, `domain` (e.g. Legal/Finance), `document_type`, `created_at`.
   - Owns `versions` via `cascade="all, delete-orphan"`.

2. **`DocumentVersion`**:
   - Manages versioning (`version_number`) and file paths.
   - **`checksum_sha256` (Indexed & Unique)**: Gatekeeper for file deduplication—skips re-processing identical uploaded files.
   - `is_current`: Distinguishes the active version for search queries while retaining audit trails.

3. **`Page`**:
   - Encapsulates page-level text extraction (`raw_text` vs `cleaned_text`).
   - `quality_score` & `ocr_applied`: Evaluates if native text extraction met quality thresholds or fell back to Tesseract OCR.

4. **`Chunk`**:
   - Bite-sized tokenized snippets (`chunk_index`, `token_count`, `content`) for LLM context windows.
   - **`vector_id` (Unique)**: External pointer mapping the SQL row to its dense embedding stored in ChromaDB.

---

## 6. SQLAlchemy `relationship()` Mechanics & Benefits

### Why `relationship()` is Used
- **Dot-notation Navigation**: Access parents and children effortlessly (e.g., `chunk.page.version.document.title`).
- **Single-Commit Tree Persist**: Pass a single nested root `DocumentRecord` into `session.add()` and SQLAlchemy automatically generates foreign keys and executes inserts in top-down dependency order.
- **Cascade Deletion**: Dropping a `DocumentRecord` or `DocumentVersion` automatically cleans up child `pages` and `chunks`.

---

## 7. SQL Query Logging Deep Dive

### How SQLAlchemy Captures Queries Under the Hood
1. **Python Global Logger Registry**: When `logging.getLogger("sqlalchemy.engine")` is configured, it taps into the global logging tree.
2. **Internal Dispatch**: SQLAlchemy’s execution core internally calls `_logger.info(statement)` before every query execution.
3. **Custom Event Interceptors**: Using `@event.listens_for(engine, "before_cursor_execute")`, we can intercept raw SQL statements, parameters, and benchmark query execution times under custom logger names (e.g., `DatabaseService`).

---

## 8. Verification & Preflight Health Status

The preflight check ([backend/core/health.py](file:///home/bhupendra/Desktop/doc-intel-hub/backend/core/health.py)) verifies directories and Ollama models:

```log
2026-08-22 00:35:12 [INFO] [HealthService]: Initiating preflight check for: Enterprise Document Intelligence Platform
2026-08-22 00:35:12 [INFO] [HealthService]: Directory ready: ./data/raw_pdfs
2026-08-22 00:35:12 [INFO] [HealthService]: Directory ready: ./data/processed
2026-08-22 00:35:12 [INFO] [HealthService]: Directory ready: ./data/chroma_db
2026-08-22 00:35:12 [INFO] [HealthService]: Connected to Ollama. Available models: ['bge-m3:latest', 'gemma4:e2b', 'gemma4:12b', 'nomic-embed-text:latest', 'llama3.2:latest']
2026-08-22 00:35:12 [INFO] [HealthService]: All configured AI models are downloaded and ready.
2026-08-22 00:35:12 [INFO] [HealthService]: >>> SYSTEM STATUS: OPERATIONAL <<<
```

---

## 9. Ingestion & Document Understanding Engine (`backend/ingestion/document_processor.py`)

### The 95/5 Hybrid OCR Escalation Architecture
PDF ingestion employs a dual-path routing strategy:
- **Fast Path (95% of documents)**: Native C-level text stream extraction via PyMuPDF. Ultra-fast, near zero CPU overhead.
- **Escalation Path (5% of documents)**: If native text quality is insufficient (scanned docs, corrupted glyphs, bad OCR layers), it renders the page into an in-memory 300 DPI raster Pixmap and invokes Tesseract OCR with English + Hindi Devanagari models (`-l eng+hin`).

```
                      [PDF Input File]
                             │
                  [PyMuPDF: Open Document]
                             │
                  [Iterate Pages 0..N]
                             │
                [Native Text: page.get_text()]
                             │
                [calculate_quality_score()]
                             │
             ┌───────────────┴───────────────┐
             │ Quality >= 0.65               │ Quality < 0.65
             ▼                               ▼
     [NATIVE Extraction]            [OCR Escalation]
             │                               │
             │                      [Render 300 DPI Pixmap]
             │                               │
             │                      [Tesseract (eng+hin)]
             │                               │
             └───────────────┬───────────────┘
                             │
                 [clean_document_text()]
                             │
               [Return Page Schema Object]
```

### Component & Method Reference

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `__init__` | `quality_threshold: float = 0.65`, `dpi: int = 300` | `None` | Configures quality cutoff, 300 DPI rendering resolution, and Tesseract flags (`--oem 3 --psm 6 -l eng+hin`). |
| `calculate_quality_score` | `text: str` | `float` (0.0 to 1.0) | Deterministic scoring formula: `(0.5 * alpha_ratio) + (0.2 * word_count_norm) + (0.3 * (1.0 - garbage_ratio))`. |
| `clean_document_text` | `text: str` | `str` | Strips non-printable ASCII/control bytes (`\x00-\x1f`, `\x7f-\x9f`, `\ufffd`), normalizes Windows `\r\n` to `\n`, and collapses repeated whitespace. |
| `process_page` | `page: fitz.Page`, `page_num: int` | `Dict[str, Any]` | Implements the fast-path vs. fallback decision logic and returns standardized per-page metadata. |
| `process_document` | `file_path: str` | `list[Dict[str, Any]]` | Main batch entrypoint. Opens PDF, iterates pages in `try...finally`, ensures `doc.close()`, and returns all page dictionaries. |

### Per-Page Output Schema
```json
{
  "page_number": 1,
  "extraction_method": "NATIVE",
  "quality_score": 0.9421,
  "raw_text": "Sample document raw text...",
  "cleaned_text": "Sample document raw text...",
  "ocr_applied": false
}
```

---

## 10. Engineering Gotchas & Troubleshooting Reference

### 1. PyMuPDF Import Compatibility (`pymupdf` vs `fitz`)
In newer releases of PyMuPDF, `import fitz` emits a deprecation warning:
> `warning: The fitz API is deprecated and will be removed in future. Use import pymupdf instead.`

**Robust Solution**:
```python
try:
    import pymupdf as fitz
except ImportError:
    import fitz  # Fallback for older versions
```

### 2. Accidental AI Citation Tags (`[cite: 1]`) in Source Code
- **Why it happens**: Copying generated code from AI chat interfaces that have search grounding enabled can inadvertently copy superscript citation badges (e.g. `[cite: 1]`).
- **Why `python -m module` didn't crash on import**: In Python grammar, `[cite: 1]` is valid **slice notation** (`sliceable[start:stop]`). When imported, Python successfully parses and compiles the AST. It only raises a runtime `NameError: name 'cite' is not defined` if and when the specific function containing the line is actually called.



---

## 11. Grounded RAG Orchestration Engine (`backend/rag/service.py`)

### Anti-Hallucination & Grounding Architecture
The Grounded RAG service bridges dense vector retrieval with LLM response generation:
- **Vector Retrieval**: Queries ChromaDB cosine space using `OllamaEmbeddingService` with similarity threshold filtering ($1.0 - 	ext{distance} \ge 	ext{SIMILARITY\_RELEVANCE\_THRESHOLD}$).
- **Empty Citation Guardrail**: If no chunks meet the threshold, returns immediate refusal without calling LLM compute.
- **Strict Context Citations**: Synthesizes prompt with enumerated citation blocks `[1]`, `[2]`, requiring verifiable attribution in LLM output.


---

## 12. FastAPI REST Service Layer (`backend/api/`)

### Architecture & Decoupled Routing
- **Decoupled APIRouter Modules**: Separates `/api/v1/rag` (query orchestration), `/api/v1/docs` (document catalog), and `/api/v1/ingest` (live multipart/form-data ingestion).
- **Synchronous Ingestion Pipeline (`POST /api/v1/ingest/upload`)**:
  - Validates PDF MIME type and calculates SHA-256 hash for document-level idempotency and deduplication.
  - Temporarily stages file in `./data/raw_pdfs/` for C-level PyMuPDF thread processing.
  - Runs 95/5 OCR escalation triage per page (`DocumentUnderstandingService`).
  - Generates structure-aware chunks (`DOC-{hash}-P{pageNum}-C{chunkNum}`).
  - Indexes dense vector embeddings into ChromaDB via `ChromaIndexer` and returns real-time processing telemetry.
- **Dependency Injection**: Utilizes `Depends(get_rag_service)` for flexible mocking and test isolation.
- **CORS Middleware**: Preconfigured for seamless cross-origin communication with frontend SPAs on `localhost:3000`.
- **System Health Dynamic Preflight**: `GET /health` runs directory permission checks and live Ollama tag queries, returning HTTP 503 for degraded states.
- **Auto-Generated Interactive Documentation**: Self-documenting OpenAPI schemas available at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## 13. Automated Testing & Evaluation Framework (Phase 10)

### 1. Test Architecture
The test suite is structured into fast, isolated unit tests and full API contract integration tests:
- **Unit Tests (`tests/unit/test_ingestion.py`)**:
  - Validates `DocumentUnderstandingService.calculate_quality_score()` with clean text ($\ge 0.70$) vs. noisy OCR/garbage strings ($< 0.40$).
  - Verifies `create_structure_aware_chunks()` splitting logic, boundary preservation, and deterministic ID tags (`P01-C001`).
- **Integration Tests (`tests/integration/test_api.py`)**:
  - Tests `/health` system preflight check response.
  - Tests `/api/v1/rag/query` with invalid payload schema (HTTP 422 Unprocessable Entity) and valid query payloads.

### 2. Mathematical Retrieval Evaluation (Recall@K)
- **Gold Evaluation Benchmark (`data/evaluation/gold_set.json`)**: Curated ground truth question-to-chunk mappings.
- **Evaluation Runner (`tests/evaluation/evaluate_retrieval.py`)**: Queries the persistent ChromaDB collection using `OllamaEmbeddingService` and calculates Top-K retrieval recall:
$$\text{Recall@K} = \frac{\text{Number of Ground Truth Chunks in Top K Results}}{\text{Total Evaluation Questions}}$$

