try:
    import pymupdf as fitz
except ImportError:
    import fitz  # Fallback for older PyMuPDF versions
import io
from PIL import Image
import pytesseract
import re
from typing import Dict, Any
from backend.core.logging import get_logger

logger = get_logger("DocumentUnderstandingService")


class DocumentUnderstandingService:
    def __init__(self, quality_threshold: float = 0.65, dpi: int = 300):
        self.quality_threshold = quality_threshold
        self.dpi = dpi
        # Configure Tesseract
        self.tesseract_config = r'--oem 3 --psm 6 -l eng'

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

    def clean_document_text(self, text: str) -> str:
        """
        Removes control noise while strictly preserving indicators (currency, percentages, clauses).
        """
        # Remove hidden control characters but keep standard printables
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ufffd]', '', text)
        text = re.sub(r'\r\n', '\n', text)
        # Normalize whitespace
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()

    def process_page(self, page: fitz.Page, page_num: int) -> Dict[str, Any]:
        """
        Implements the 95/5 escalation rule for a single page.
        """
        # 1. Attempt the Fast Path (Native C-level extraction)
        native_text = page.get_text("text")
        native_quality = self.calculate_quality_score(native_text)
        
        if native_quality >= self.quality_threshold:
            return {
                "page_number": page_num + 1,
                "extraction_method": "NATIVE",
                "quality_score": native_quality,
                "raw_text": native_text,
                "cleaned_text": self.clean_document_text(native_text),
                "ocr_applied": False
            }

        # 2. Attempt the Escalation Path (Tesseract OCR Fallback)
        logger.debug(f"Page {page_num + 1} native quality ({native_quality}) below threshold. Escalating to OCR.")
        
        # Render the specific page to a high-res image (Pixmap) in memory
        pix = page.get_pixmap(dpi=self.dpi)
        img_bytes = pix.tobytes("png")
        pil_image = Image.open(io.BytesIO(img_bytes))
        
        # Run OCR
        try:
            ocr_text = pytesseract.image_to_string(pil_image, config=self.tesseract_config)
        except Exception:
            ocr_text = pytesseract.image_to_string(pil_image)
        ocr_quality = self.calculate_quality_score(ocr_text)
        
        return {
            "page_number": page_num + 1,
            "extraction_method": "OCR",
            "quality_score": ocr_quality,
            "raw_text": ocr_text,
            "cleaned_text": self.clean_document_text(ocr_text),
            "ocr_applied": True
        }

    def process_document(self, file_path: str) -> list:
        """
        Iterates through the document and processes each page securely.
        """
        pages_data = []
        doc = fitz.open(file_path)
        
        try:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_result = self.process_page(page, page_num)
                pages_data.append(page_result)
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
        finally:
            doc.close()
            
        return pages_data
