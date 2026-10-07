import os
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Tuple
from PIL import Image

try:
    import fitz
except ImportError:
    try:
        import pymupdf as fitz
    except ImportError:
        fitz = None

from app.config import CROPS_DIR, PAGES_DIR, UPLOAD_DIR, GEMINI_API_KEY, VLM_MODEL
from app.models import DocumentChunk
from app.retriever import retriever

class DocumentParser:
    """
    Member 2 Deliverable:
    Multimodal Document Ingestion & Vision Parser.
    Extracts text, tables, and high-res chart/figure crops with pixel coordinates.
    """
    def __init__(self, crops_dir: Path = CROPS_DIR, pages_dir: Path = PAGES_DIR):
        self.crops_dir = crops_dir
        self.pages_dir = pages_dir

    def render_page_to_image(self, page, doc_name: str, page_num: int, dpi: int = 200) -> Path:
        """Renders a PDF page to a PNG image for full-page evidence viewing."""
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        safe_name = Path(doc_name).stem
        page_image_path = self.pages_dir / f"{safe_name}_page_{page_num}.png"
        pix.save(str(page_image_path))
        return page_image_path

    def extract_visual_crops(self, doc, page, doc_name: str, page_num: int) -> List[Tuple[Path, List[float]]]:
        """
        Detects image and drawing regions (charts/tables/diagrams) and saves crops.
        Returns list of (crop_path, bbox).
        """
        crops = []
        safe_name = Path(doc_name).stem
        image_list = page.get_images(full=True)

        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                # Extract image rect on the page
                rects = page.get_image_rects(xref)
                if not rects:
                    continue
                rect = rects[0]
                
                # Filter out tiny icons / logos (width or height < 60px)
                if rect.width < 60 or rect.height < 60:
                    continue

                # Crop image from page rendering
                zoom = 2.0
                mat = fitz.Matrix(zoom, zoom)
                clip = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y1)
                pix = page.get_pixmap(matrix=mat, clip=clip)

                crop_filename = f"{safe_name}_p{page_num}_crop_{img_idx+1}.png"
                crop_path = self.crops_dir / crop_filename
                pix.save(str(crop_path))

                bbox = [round(rect.x0, 1), round(rect.y0, 1), round(rect.x1, 1), round(rect.y1, 1)]
                crops.append((crop_path, bbox))
            except Exception as e:
                print(f"[Parser] Crop error on page {page_num}, image {img_idx}: {e}")

        return crops

    async def generate_vlm_visual_caption(self, crop_path: Path) -> str:
        """
        Calls VLM (Gemini Vision) to analyze the cropped chart/table visually.
        Generates textual summary + data points for dense embedding and BM25 retrieval.
        """
        if not GEMINI_API_KEY:
            return f"Visual chart/figure extracted from {crop_path.name}"

        import httpx
        import base64
        with open(crop_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")

        prompt = (
            "Analyze this visual document element (chart, graph, or table). "
            "Identify: 1) Title and type, 2) X and Y axes labels and units, "
            "3) Key values, numbers, and trend observations. Output concise factual summary."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{VLM_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/png", "data": b64_data}}
                ]
            }]
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        return candidates[0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"[Parser] VLM visual caption error: {e}")

        return f"Chart visual element {crop_path.stem}."

    async def parse_and_index_pdf(self, pdf_path: str) -> List[DocumentChunk]:
        """
        Full end-to-end PDF processing:
        1. Renders high-res full page images for proof preview.
        2. Crops charts/tables and generates VLM visual summaries.
        3. Extracts text blocks with bounding boxes.
        4. Indexes all multimodal chunks into hybrid vector store.
        """
        if fitz is None:
            raise ImportError("PyMuPDF (fitz) is required. Install with: pip install PyMuPDF")

        path = Path(pdf_path)
        doc = fitz.open(str(path))
        doc_name = path.name
        all_chunks: List[DocumentChunk] = []

        for page_num in range(1, len(doc) + 1):
            page = doc[page_num - 1]
            page_img_path = self.render_page_to_image(page, doc_name, page_num)

            # 1. Visual Crops (Charts, Figures)
            crops = self.extract_visual_crops(doc, page, doc_name, page_num)
            for crop_path, bbox in crops:
                vlm_summary = await self.generate_vlm_visual_caption(crop_path)
                chart_chunk = DocumentChunk(
                    chunk_id=f"{Path(doc_name).stem}_p{page_num}_{crop_path.stem}",
                    doc_name=doc_name,
                    page_number=page_num,
                    chunk_type="chart",
                    content=f"### VISUAL CHART / FIGURE:\n{vlm_summary}",
                    bbox=bbox,
                    crop_path=str(crop_path),
                    page_image_path=str(page_img_path),
                    metadata={"section": "Visual Chart Evidence"}
                )
                all_chunks.append(chart_chunk)

            # 2. Text Blocks with Bounding Boxes
            blocks = page.get_text("blocks")
            for b_idx, block in enumerate(blocks):
                x0, y0, x1, y1, text, block_no, block_type = block
                cleaned_text = text.strip()
                if len(cleaned_text) < 25:
                    continue  # skip headers/page numbers

                text_chunk = DocumentChunk(
                    chunk_id=f"{Path(doc_name).stem}_p{page_num}_b{b_idx}",
                    doc_name=doc_name,
                    page_number=page_num,
                    chunk_type="text",
                    content=cleaned_text,
                    bbox=[round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                    crop_path=None,
                    page_image_path=str(page_img_path),
                    metadata={"section": f"Paragraph {b_idx+1}"}
                )
                all_chunks.append(text_chunk)

        doc.close()
        
        # Index chunks into Member 1's SQLite & Vector Database
        await retriever.add_chunks(all_chunks)
        print(f"✅ Successfully indexed {len(all_chunks)} chunks for {doc_name}")
        return all_chunks

parser = DocumentParser()
