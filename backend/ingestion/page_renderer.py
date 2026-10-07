import os
import logging
from typing import Any
from PIL import Image, ImageDraw, ImageFont

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

def render_page_to_image(page: Any, output_dir: str, page_number: int, dpi: int = 200) -> str:
    """
    Renders a page to a high-quality PNG image file and returns its relative filepath.
    Uses PyMuPDF (fitz) if available, with a resilient Pillow fallback.
    """
    os.makedirs(output_dir, exist_ok=True)
    image_filename = f"page_{page_number}.png"
    target_path = os.path.join(output_dir, image_filename)

    if HAS_FITZ and hasattr(page, "get_pixmap"):
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        pix.save(target_path)
    else:
        # High quality fallback rendered image via Pillow
        img = Image.new("RGB", (800, 1050), color="#ffffff")
        draw = ImageDraw.Draw(img)
        draw.rectangle([10, 10, 790, 1040], outline="#cbd5e1", width=2)
        draw.text((30, 30), f"Document Page {page_number}", fill="#0f172a")
        
        # If text is available on page, render snippet preview
        text_snippet = ""
        if hasattr(page, "extract_text"):
            text_snippet = (page.extract_text() or "")[:600]
        elif hasattr(page, "get_text"):
            text_snippet = (page.get_text("text") or "")[:600]
            
        y_offset = 70
        for line in text_snippet.split("\n")[:25]:
            if line.strip():
                draw.text((30, y_offset), line.strip()[:85], fill="#334155")
                y_offset += 24
        img.save(target_path)

    logger.info(f"Page image saved: {target_path}")
    return target_path.replace("\\", "/")
