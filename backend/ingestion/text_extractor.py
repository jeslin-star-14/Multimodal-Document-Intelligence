import re
import logging
from typing import Tuple, Optional, List, Dict, Any
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

def clean_extracted_text(text: str) -> str:
    """
    Cleans obvious extraction artifacts without aggressively modifying original content.
    """
    if not text:
        return ""
    # Remove null characters or control chars
    text = text.replace('\x00', '')
    # Normalize excessive blank lines while preserving meaningful line breaks
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip trailing whitespace on each line
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip()

def detect_section_heading(page: fitz.Page) -> Optional[str]:
    """
    Attempts basic section heading detection based on font sizes and line structure.
    """
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
                
                # Calculate average font size and bold check for line
                max_size = max([span["size"] for span in line["spans"]], default=0)
                is_bold = any(("bold" in span.get("font", "").lower() or span.get("flags", 0) & 2 != 0) for span in line["spans"])
                
                # Check if it looks like a heading
                if max_size > 11 or is_bold:
                    # Filter out header numbers or page numbers
                    if not re.match(r'^\d+$', line_text) and not line_text.lower().startswith("page "):
                        heading_candidates.append((max_size, is_bold, line_text))
        
        if heading_candidates:
            # Sort by font size descending, then bold
            heading_candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
            return heading_candidates[0][2]
    except Exception as e:
        logger.debug(f"Section detection failed on page: {e}")
    return None

def extract_text_from_page(page: fitz.Page) -> Tuple[str, Optional[str]]:
    """
    Extracts text and detects possible section heading from a page.
    
    Returns:
        Tuple of (extracted_text, detected_section)
    """
    raw_text = page.get_text("text")
    cleaned_text = clean_extracted_text(raw_text)
    section = detect_section_heading(page)
    return cleaned_text, section
