# backend/api/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# Register decoupled API routers
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

# Mount built frontend static assets if dist exists
dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")
