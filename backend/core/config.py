# backend/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "Enterprise Document Intelligence Platform"

    # Storage Paths
    DATABASE_URL: str
    CHROMA_PERSIST_DIR: str

    # AI Engine
    OLLAMA_BASE_URL: str
    GENERATION_MODEL: str
    EMBEDDING_MODEL: str

    # Heuristics & Gate Thresholds
    MIN_PAGE_QUALITY_SCORE: float
    SIMILARITY_RELEVANCE_THRESHOLD: float
    TOP_K_CHUNKS: int

    # Automatically read from .env if present
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()
# print(settings)