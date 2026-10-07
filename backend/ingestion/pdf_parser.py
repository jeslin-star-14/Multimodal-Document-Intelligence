import os
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Try importing fitz (PyMuPDF)
try:
    import fitz
    HAS_FITZ = True
except ImportError:
    fitz = None
    HAS_FITZ = False
    logger.warning("PyMuPDF (fitz) not yet installed. Falling back to pypdf engine.")

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    PdfReader = None
    HAS_PYPDF = False


class PDFParser:
    """
    Safely opens and retrieves structure from PDF documents using PyMuPDF (fitz)
    with seamless fallback to pypdf.
    """

    def __init__(self, pdf_path: str):
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at path: {pdf_path}")
        self.pdf_path = pdf_path
        self.doc: Any = None
        self.reader: Any = None
        self.engine = "fitz" if HAS_FITZ else "pypdf"

    def __enter__(self):
        try:
            if HAS_FITZ:
                self.doc = fitz.open(self.pdf_path)
                self.engine = "fitz"
            elif HAS_PYPDF:
                self.reader = PdfReader(self.pdf_path)
                self.engine = "pypdf"
            else:
                raise ImportError("Neither fitz nor pypdf is available for PDF processing.")
            return self
        except Exception as e:
            logger.error(f"Failed to open PDF {self.pdf_path}: {str(e)}")
            raise

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.doc and HAS_FITZ:
            try:
                self.doc.close()
            except Exception:
                pass

    @property
    def page_count(self) -> int:
        if self.engine == "fitz" and self.doc:
            return len(self.doc)
        elif self.engine == "pypdf" and self.reader:
            return len(self.reader.pages)
        return 0

    def get_page(self, page_index: int) -> Any:
        """
        Retrieves a 0-indexed Page object.
        """
        if self.engine == "fitz" and self.doc:
            return self.doc[page_index]
        elif self.engine == "pypdf" and self.reader:
            return self.reader.pages[page_index]
        raise RuntimeError("PDF document is not open.")
