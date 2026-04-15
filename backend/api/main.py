# backend/api/main.py
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.core.health import check_directories, check_ai_engine_status
from backend.api.routers import rag, documents, ingest, observability

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for Multimodal Document Intelligence and RAG",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Register decoupled API routers
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG Engine"])
app.include_router(documents.router, prefix="/api/v1/docs", tags=["Document Catalog"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["Data Pipeline"])
app.include_router(observability.router, prefix="/api/v1/observability", tags=["Observability"])


@app.get("/health", tags=["System"])
def system_health_check():
    """Runs the preflight checks dynamically."""
    dirs_ok = check_directories()
    ai_ok = check_ai_engine_status()

    if dirs_ok and ai_ok:
        return {"status": "healthy", "ai_engine": "online", "ai_mode": settings.AI_MODE}
    else:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "ai_engine": "offline or missing credentials", "ai_mode": settings.AI_MODE}
        )


# 2. Serve React static build files (CSS, JS) from frontend/dist
react_build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(react_build_dir):
    # Mount frontend static files as default
    app.mount("/", StaticFiles(directory=react_build_dir, html=True), name="ui")

    # Catch-all exception handler for SPA frontend routing
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        # Keep API 404s returning standard JSON error
        if request.url.path.startswith("/api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        index_file = os.path.join(react_build_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
