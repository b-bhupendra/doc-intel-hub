# backend/core/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional

IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
DEFAULT_DB_URL = "sqlite:////tmp/doc_intel_hub.db" if IS_VERCEL else "sqlite:///./data/doc_intel_hub.db"
DEFAULT_CHROMA_DIR = "/tmp/chroma_db" if IS_VERCEL else "./data/chroma_db"


class Settings(BaseSettings):
    ENVIRONMENT: str = "production" if IS_VERCEL else "development"
    PROJECT_NAME: str = "Enterprise Document Intelligence Platform"
    IS_VERCEL: bool = IS_VERCEL

    # The Factory Toggle Switch ("offline" | "cloud")
    AI_MODE: Literal["offline", "cloud"] = "cloud" if IS_VERCEL else "offline"

    # Storage Paths (auto-routes to writable /tmp on Vercel)
    DATABASE_URL: str = DEFAULT_DB_URL
    CHROMA_PERSIST_DIR: str = DEFAULT_CHROMA_DIR

    # Offline Config (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OFFLINE_GENERATION_MODEL: str = "llama3.2:latest"
    OFFLINE_EMBEDDING_MODEL: str = "bge-m3:latest"

    # Cloud Config (Groq / Cohere)
    GROQ_API_KEY: str = ""
    COHERE_API_KEY: str = ""
    CLOUD_GENERATION_MODEL: str = "openai/gpt-oss-120b"
    CLOUD_EMBEDDING_MODEL: str = "embed-multilingual-v3.0"

    # Backward compatibility overrides if specified in .env
    GENERATION_MODEL_OVERRIDE: Optional[str] = None
    EMBEDDING_MODEL_OVERRIDE: Optional[str] = None

    # Heuristics & Gate Thresholds
    MIN_PAGE_QUALITY_SCORE: float = 0.65
    SIMILARITY_RELEVANCE_THRESHOLD: float = 0.40
    TOP_K_CHUNKS: int = 5

    @property
    def GENERATION_MODEL(self) -> str:
        if self.GENERATION_MODEL_OVERRIDE:
            return self.GENERATION_MODEL_OVERRIDE
        return self.CLOUD_GENERATION_MODEL if self.AI_MODE == "cloud" else self.OFFLINE_GENERATION_MODEL

    @property
    def EMBEDDING_MODEL(self) -> str:
        if self.EMBEDDING_MODEL_OVERRIDE:
            return self.EMBEDDING_MODEL_OVERRIDE
        return self.CLOUD_EMBEDDING_MODEL if self.AI_MODE == "cloud" else self.OFFLINE_EMBEDDING_MODEL

    # Automatically read from .env if present
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()