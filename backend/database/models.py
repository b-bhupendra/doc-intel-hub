# backend/database/models.py
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class DocumentRecord(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True) 
    title: Mapped[str] = mapped_column(String(255), index=True)
    domain: Mapped[str] = mapped_column(String(128), default="Enterprise")
    document_type: Mapped[str] = mapped_column(String(64)) 
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # One-to-Many relationship with Versions
    versions: Mapped[List["DocumentVersion"]] = relationship(back_populates="document")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True) 
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"))
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    checksum_sha256: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    file_path: Mapped[str] = mapped_column(String(512))
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    document: Mapped["DocumentRecord"] = relationship(back_populates="versions")
    pages: Mapped[List["Page"]] = relationship(back_populates="version")

class Page(Base):
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(String(128), primary_key=True) 
    version_id: Mapped[str] = mapped_column(ForeignKey("document_versions.id"))
    page_number: Mapped[int] = mapped_column(Integer)
    extraction_method: Mapped[str] = mapped_column(String(32)) 
    quality_score: Mapped[float] = mapped_column(Float)
    raw_text: Mapped[str] = mapped_column(Text)
    cleaned_text: Mapped[str] = mapped_column(Text)
    ocr_applied: Mapped[bool] = mapped_column(Boolean, default=False)

    version: Mapped["DocumentVersion"] = relationship(back_populates="pages")
    chunks: Mapped[List["Chunk"]] = relationship(back_populates="page")

class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(String(128), primary_key=True) 
    page_id: Mapped[str] = mapped_column(ForeignKey("pages.id"))
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer)
    vector_id: Mapped[str] = mapped_column(String(128), unique=True) 
    
    page: Mapped["Page"] = relationship(back_populates="chunks")