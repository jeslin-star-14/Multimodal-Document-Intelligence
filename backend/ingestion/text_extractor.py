import re
import logging
from typing import Tuple, Optional, List, Dict, Any

logger = logging.getLogger(__name__)

try:
    import fitz
    HAS_FITZ = True
except ImportError:
    try:
        import pymupdf as fitz
        HAS_FITZ = True
    except ImportError:
        fitz = None
        HAS_FITZ = False

def clean_extracted_text(text: str) -> str:
    """
    Cleans obvious extraction artifacts without aggressively modifying original content.
    """
    if not text:
        return ""
    text = text.replace('\x00', '')
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip()

def detect_section_heading(page: Any) -> Optional[str]:
    """
    Attempts basic section heading detection based on font sizes and line structure.
    """
    if not HAS_FITZ or not hasattr(page, "get_text"):
        return None
    try:
        blocks = page.get_text("dict", flags=fitz.TEXT_DEHYPHENATE)["blocks"]
        heading_candidates = []
        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                line_text = "".join([span["text"] for span in line["spans"]]).strip()
                if not line_text or len(line_text) < 3 or len(line_text) > 80:
                    continue
                max_size = max([span["size"] for span in line["spans"]], default=0)
                is_bold = any(("bold" in span.get("font", "").lower() or span.get("flags", 0) & 2 != 0) for span in line["spans"])
                if max_size > 11 or is_bold:
                    if not re.match(r'^\d+$', line_text) and not line_text.lower().startswith("page "):
                        heading_candidates.append((max_size, is_bold, line_text))
        if heading_candidates:
            heading_candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
            return heading_candidates[0][2]
    except Exception as e:
        logger.debug(f"Section detection failed on page: {e}")
    return None

def extract_text_from_page(page: Any) -> Tuple[str, Optional[str]]:
    """
    Extracts text and detects possible section heading from a page.
    Supports both PyMuPDF (fitz) and pypdf page objects.
    """
    raw_text = ""
    if hasattr(page, "get_text"):
        raw_text = page.get_text("text")
    elif hasattr(page, "extract_text"):
        raw_text = page.extract_text() or ""
        
    cleaned_text = clean_extracted_text(raw_text)
    section = detect_section_heading(page)
    return cleaned_text, section
