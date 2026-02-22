# tests/unit/test_ingestion.py
import pytest
from backend.ingestion.document_processor import DocumentUnderstandingService
from backend.retrieval.chunking import create_structure_aware_chunks


def test_calculate_quality_score():
    service = DocumentUnderstandingService()
    
    # Clean text should score high
    clean_text = "Section 1. The maximum financial limit is ₹50,000 for disability pension."
    clean_score = service.calculate_quality_score(clean_text)
    assert clean_score >= 0.70
    
    # Garbage text (bad OCR/native extraction) should score low
    garbage_text = " %& \x00\x08\x0b\x0c\x0e\x1f \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd"
    garbage_score = service.calculate_quality_score(garbage_text)
    assert garbage_score < 0.40


def test_structure_aware_chunking():
    # Simulate a document with logical policy sections
    raw_text = "Section 1\nThis is the first part.\nSection 2\nThis is the second part."
    chunks = create_structure_aware_chunks(page_id="P01", cleaned_text=raw_text, max_chunk_chars=50)
    
    assert len(chunks) == 2
    assert "Section 1" in chunks[0]["content"]
    assert "Section 2" in chunks[1]["content"]
    assert chunks[0]["chunk_id"] == "P01-C001"
