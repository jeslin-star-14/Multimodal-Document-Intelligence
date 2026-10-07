import os
import logging
from typing import Dict, Any, Optional
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

class PDFParser:
    """
    Safely opens and retrieves structure from PDF documents using PyMuPDF (fitz).
    """

    def __init__(self, pdf_path: str):
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at path: {pdf_path}")
        self.pdf_path = pdf_path
        self.doc: Optional[fitz.Document] = None

    def __enter__(self):
        try:
            self.doc = fitz.open(self.pdf_path)
            return self
        except Exception as e:
            logger.error(f"Failed to open PDF {self.pdf_path}: {str(e)}")
            raise

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.doc:
            self.doc.close()

    @property
    def page_count(self) -> int:
        if not self.doc:
            return 0
        return len(self.doc)

    def get_page(self, page_index: int) -> fitz.Page:
        """
        Retrieves a 0-indexed PyMuPDF Page object.
        """
        if not self.doc:
            raise RuntimeError("PDF document is not open.")
        return self.doc[page_index]
