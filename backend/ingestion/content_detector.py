import re
import logging
from typing import List, Literal, Dict, Any

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

VisualContentType = Literal["chart", "graph", "image", "table"]

def detect_visual_content(page: Any, extracted_text: str, has_tables: bool) -> List[Dict[str, Any]]:
    results = []
    if has_tables:
        results.append({
            "type": "table",
            "confidence": 0.9,
            "details": "Table structures detected"
        })

    num_images = 0
    num_drawings = 0
    if HAS_FITZ and hasattr(page, "get_images"):
        try:
            num_images = len(page.get_images(full=True))
            num_drawings = len(page.get_drawings())
        except Exception:
            pass
    elif hasattr(page, "images"):
        try:
            num_images = len(page.images)
        except Exception:
            pass

    text_lower = extracted_text.lower()
    has_chart_keyword = any(k in text_lower for k in ["chart", "figure", "fig.", "plot", "graph", "diagram", "trend", "percentage", "axis"])
    has_graph_keyword = any(k in text_lower for k in ["graph", "network", "workflow", "flowchart", "node"])

    if num_drawings > 35 or (num_drawings > 15 and has_chart_keyword):
        detected_type: VisualContentType = "graph" if has_graph_keyword else "chart"
        results.append({
            "type": detected_type,
            "confidence": 0.85,
            "details": f"High vector path density ({num_drawings} paths) with chart keywords"
        })
    elif num_images > 0:
        if has_chart_keyword:
            results.append({
                "type": "chart",
                "confidence": 0.8,
                "details": f"Embedded image with chart keywords"
            })
        elif has_graph_keyword:
            results.append({
                "type": "graph",
                "confidence": 0.8,
                "details": f"Embedded image with graph keywords"
            })
        else:
            results.append({
                "type": "image",
                "confidence": 0.75,
                "details": f"Embedded bitmap image found ({num_images} image(s))"
            })

    return results
