import fitz
from typing import Dict, Any
from backend.core.logging import get_logger

logger = get_logger("DocumentUnderstandingService")


class DocumentUnderstandingService:
    def __init__(self, quality_threshold: float = 0.65, dpi: int = 300):
        self.quality_threshold = quality_threshold
        self.dpi = dpi
        # Configure Tesseract to look for English + Hindi (Devanagari)
        self.tesseract_config = r'--oem 3 --psm 6 -l eng+hin'
