# backend/api/main.py
from fastapi import FastAPI

from backend.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for Multimodal Document Intelligence and RAG",
    version="1.0.0"
)
