import os
import logging
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

def render_page_to_image(page: fitz.Page, output_dir: str, page_number: int, dpi: int = 200) -> str:
    """
    Renders a PyMuPDF page to a high-quality PNG image file and returns its relative filepath.
    
    Args:
        page: fitz.Page object
        output_dir: Directory where the image should be saved (e.g. data/pages/DOC001)
        page_number: 1-indexed page number
        dpi: Target DPI resolution for rendering (default: 200)
    
    Returns:
        Relative path string to the saved image
    """
    os.makedirs(output_dir, exist_ok=True)
    image_filename = f"page_{page_number}.png"
    target_path = os.path.join(output_dir, image_filename)

    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(target_path)
    
    logger.info(f"Page image saved: {target_path}")
    return target_path.replace("\\", "/")
