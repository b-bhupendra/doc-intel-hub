import fitz
import re
from typing import Dict, Any
from backend.core.logging import get_logger

logger = get_logger("DocumentUnderstandingService")


class DocumentUnderstandingService:
    def __init__(self, quality_threshold: float = 0.65, dpi: int = 300):
        self.quality_threshold = quality_threshold
        self.dpi = dpi
        # Configure Tesseract to look for English + Hindi (Devanagari)
        self.tesseract_config = r'--oem 3 --psm 6 -l eng+hin'

    def calculate_quality_score(self, text: str) -> float:
        """
        Calculates a deterministic quality score (0.0 to 1.0) based on character density.
        Helps detect 'hidden garbage' text layers in badly scanned PDFs.
        """
        if not text or len(text.strip()) == 0:
            return 0.0
        
        total_chars = len(text)
        # Count standard alphanumeric and useful punctuation
        alpha_num_chars = len(re.findall(r'[\w\s.,₹%/\-]', text))
        alpha_ratio = min(1.0, alpha_num_chars / max(1, total_chars))
        
        # Check for unreadable replacement characters or control noise
        garbage_chars = len(re.findall(r'[\ufffd\x00-\x08\x0b\x0c\x0e-\x1f]', text))
        garbage_ratio = garbage_chars / max(1, total_chars)
        
        # Word count normalization (rewards pages with substantial text)
        words = text.split()
        word_count_norm = min(1.0, len(words) / 100.0)
        
        # Formula prioritizes high valid character ratios and penalizes garbage noise
        quality = (0.5 * alpha_ratio) + (0.2 * word_count_norm) + (0.3 * (1.0 - garbage_ratio))
        return round(quality, 4)
