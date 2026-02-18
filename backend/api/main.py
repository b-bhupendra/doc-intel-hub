# backend/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings

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
