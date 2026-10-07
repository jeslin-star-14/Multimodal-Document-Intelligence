import re
import logging
from typing import List, Literal, Dict, Any
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

VisualContentType = Literal["chart", "graph", "image", "table"]

def detect_visual_content(page: fitz.Page, extracted_text: str, has_tables: bool) -> List[Dict[str, Any]]:
    """
    Detects likely visual content such as charts, graphs, images, or tables on a page.
    Uses simple heuristics based on PDF images, vector graphics drawings, and text keywords.
    
    Returns:
        List of dicts representing visual content detections:
        [{"type": "chart" | "graph" | "image" | "table", "confidence": float, "details": str}]
    """
    results = []
    
    # 1. If tables were detected by table_extractor
    if has_tables:
        results.append({
            "type": "table",
            "confidence": 0.9,
            "details": "Table structures detected"
        })

    # 2. Check bitmap images embedded in the page
    images = page.get_images(full=True)
    num_images = len(images)

    # 3. Check vector drawings (often used to render SVG-like charts, bar graphs, pie charts)
    drawings = page.get_drawings()
    num_drawings = len(drawings)

    text_lower = extracted_text.lower()
    
    # Keyword indicators
    has_chart_keyword = any(k in text_lower for k in ["chart", "figure", "fig.", "plot", "graph", "diagram", "trend", "percentage", "axis"])
    has_graph_keyword = any(k in text_lower for k in ["graph", "network", "workflow", "flowchart", "node"])

    # Heavy vector drawing density usually indicates charts/graphs rendered directly as PDF paths
    if num_drawings > 35 or (num_drawings > 15 and has_chart_keyword):
        detected_type: VisualContentType = "graph" if has_graph_keyword else "chart"
        results.append({
            "type": detected_type,
            "confidence": 0.85,
            "details": f"High vector path density ({num_drawings} paths) with chart keywords"
        })
    elif num_images > 0:
        # Check if text mentions chart/graph
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
