# backend/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.core.health import check_directories, check_ollama_status
from backend.api.routers import rag, documents

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for Multimodal Document Intelligence and RAG",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to the specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the decoupled routers
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG Engine"])
app.include_router(documents.router, prefix="/api/v1/docs", tags=["Document Management"])

@app.get("/health", tags=["System"])
def system_health_check():
    """Runs the Phase 1 preflight checks dynamically."""
    dirs_ok = check_directories()
    ollama_ok = check_ollama_status()
    
    if dirs_ok and ollama_ok:
        return {"status": "healthy", "ai_engine": "online"}
    else:
        return JSONResponse(
            status_code=503, 
            content={"status": "degraded", "ai_engine": "offline or missing models"}
        )
