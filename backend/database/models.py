# backend/database/models.py
from datetime import datetime
from typing import List
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
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