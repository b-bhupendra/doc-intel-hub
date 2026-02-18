# backend/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.api.routers import rag, documents

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for Multimodal Document Intelligence and RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG Engine"])
app.include_router(documents.router, prefix="/api/v1/docs", tags=["Document Management"])
