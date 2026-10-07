import os
import re
import json
import uuid
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont

from schemas.evidence import Evidence, DocumentProcessResponse, TableData, EvidenceType
from ingestion.pipeline import process_document as process_pdf_document

logger = logging.getLogger(__name__)

def generate_doc_id(file_path: str) -> str:
    """Generates a stable, unique Document ID for any file."""
    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    file_hash = hashlib.md5(f"{filename}_{file_size}".encode()).hexdigest()[:6].upper()
    return f"DOC_{file_hash}"

def render_text_to_page_image(
    title: str, 
    paragraphs: List[str], 
    tables: List[Dict[str, Any]], 
    output_path: str,
    page_num: int = 1,
    total_pages: int = 1
):
    """
    Renders text and tables into a clean, professional, high-res page image (1200x1600)
    for document preview in the UI when the source is not a native PDF.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 1200, 1600
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Use default bitmap font or basic font
    font = ImageFont.load_default()

    # Draw page border & header background
    draw.rectangle([0, 0, width, 70], fill=(245, 247, 250))
    draw.line([(0, 70), (width, 70)], fill=(220, 225, 230), width=2)
    
    # Header text
    draw.text((40, 25), title[:70], fill=(30, 41, 59), font=font)
    page_indicator = f"Page {page_num} of {total_pages}"
    draw.text((width - 160, 25), page_indicator, fill=(100, 116, 139), font=font)

    # Footer
    draw.line([(0, height - 50), (width, height - 50)], fill=(220, 225, 230), width=1)
    draw.text((40, height - 35), "Multimodal Document Intelligence Pipeline", fill=(148, 163, 184), font=font)

    # Content Area
    y = 100
    for para in paragraphs:
        if y > height - 120:
            break
        text = para.strip()
        if not text:
            y += 15
            continue

        # Wrap text simply
        words = text.split()
        line = ""
        is_heading = len(text) < 60 and (text.endswith(":") or text.isupper() or text.startswith("#"))
        line_color = (15, 23, 42) if is_heading else (51, 65, 85)
        
        if is_heading:
            y += 10
            draw.text((40, y), text, fill=(15, 23, 42), font=font)
            y += 26
            continue

        for word in words:
            test_line = f"{line} {word}".strip()
            if len(test_line) * 7 > (width - 100):
                draw.text((50, y), line, fill=line_color, font=font)
                y += 20
                line = word
                if y > height - 120:
                    break
            else:
                line = test_line
        if line and y <= height - 120:
            draw.text((50, y), line, fill=line_color, font=font)
            y += 24

    # Draw Tables if any
    for tab in tables:
        if y > height - 200:
            break
        headers = tab.get("headers", [])
        rows = tab.get("rows", [])
        if not headers and not rows:
            continue

        y += 15
        draw.text((40, y), "Extracted Table:", fill=(16, 185, 129), font=font)
        y += 22

        col_w = max(100, int((width - 100) / max(1, len(headers or (rows[0] if rows else [1])))))
        # Header row
        if headers:
            draw.rectangle([40, y, width - 40, y + 26], fill=(240, 253, 244))
            for c_idx, h in enumerate(headers[:6]):
                draw.text((45 + c_idx * col_w, y + 6), str(h)[:25], fill=(21, 128, 61), font=font)
            y += 28

        # Data rows
        for r in rows[:8]:
            if y > height - 80:
                break
            draw.line([(40, y), (width - 40, y)], fill=(229, 231, 235), width=1)
            for c_idx, val in enumerate(r[:6]):
                draw.text((45 + c_idx * col_w, y + 5), str(val)[:25], fill=(55, 65, 81), font=font)
            y += 24

    img.save(output_path, "PNG")
    return output_path

def process_docx_file(docx_path: str, output_base_dir: str = "data") -> Dict[str, Any]:
    """
    Parses a .docx Word document, extracts paragraphs, sections, tables,
    generates preview page images, and constructs Evidence items.
    """
    import docx

    doc_name = os.path.basename(docx_path)
    doc_id = generate_doc_id(docx_path)

    pages_dir = os.path.join(output_base_dir, "pages", doc_id)
    processed_dir = os.path.join(output_base_dir, "processed")
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)

    doc = docx.Document(docx_path)
    
    # Extract all paragraphs and tables
    all_paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    
    all_tables_data = []
    for t_idx, table in enumerate(doc.tables):
        if not table.rows:
            continue
        headers = [c.text.strip() for c in table.rows[0].cells]
        rows = []
        for row in table.rows[1:]:
            r_vals = [c.text.strip() for c in row.cells]
            if any(r_vals):
                rows.append(r_vals)
        all_tables_data.append({"headers": headers, "rows": rows, "table_id": f"T{t_idx+1}"})

    # Divide paragraphs into virtual pages (approx 15-20 paragraphs per page)
    PAGE_SIZE = 16
    para_chunks = [all_paras[i:i + PAGE_SIZE] for i in range(0, max(1, len(all_paras)), PAGE_SIZE)]
    if not para_chunks:
        para_chunks = [["[Empty Document]"]]

    total_pages = len(para_chunks)
    all_evidence: List[Evidence] = []
    evidence_counter = 1

    for page_idx, page_paras in enumerate(para_chunks):
        page_num = page_idx + 1
        page_img_path = os.path.join(pages_dir, f"page_{page_num}.png")
        
        # Tables for this page
        page_tables = [all_tables_data[page_idx]] if page_idx < len(all_tables_data) else []
        
        render_text_to_page_image(
            title=doc_name,
            paragraphs=page_paras,
            tables=page_tables,
            output_path=page_img_path,
            page_num=page_num,
            total_pages=total_pages
        )

        # 1. Text Evidence chunk
        page_text = "\n\n".join(page_paras)
        section_name = page_paras[0][:40] if page_paras else f"Page {page_num}"
        
        all_evidence.append(Evidence(
            evidence_id=f"E{evidence_counter:03d}",
            document_id=doc_id,
            document_name=doc_name,
            page=page_num,
            section=section_name,
            type=EvidenceType.TEXT,
            text=page_text,
            table=None,
            image_path=page_img_path,
            metadata={"word_count": len(page_text.split()), "scanned": False}
        ))
        evidence_counter += 1

        # 2. Table Evidence chunks
        for t_data in page_tables:
            all_evidence.append(Evidence(
                evidence_id=f"E{evidence_counter:03d}",
                document_id=doc_id,
                document_name=doc_name,
                page=page_num,
                section=f"Table: {', '.join(t_data['headers'][:3])}",
                type=EvidenceType.TABLE,
                text=f"Table Data: Headers: {' | '.join(t_data['headers'])}\nRows: {len(t_data['rows'])} records",
                table=TableData(headers=t_data["headers"], rows=t_data["rows"]),
                image_path=page_img_path,
                metadata={"rows_count": len(t_data["rows"])}
            ))
            evidence_counter += 1

    # Save to processed JSON
    processed_json_path = os.path.join(processed_dir, f"{doc_id}.json")
    resp_obj = DocumentProcessResponse(
        document_id=doc_id,
        document_name=doc_name,
        page_count=total_pages,
        evidence_count=len(all_evidence),
        evidence=all_evidence
    )
    with open(processed_json_path, "w", encoding="utf-8") as f:
        json.dump(resp_obj.model_dump(), f, indent=2)

    logger.info(f"Processed DOCX {doc_name}: {total_pages} pages, {len(all_evidence)} evidence chunks.")
    return resp_obj.model_dump()


def process_pptx_file(pptx_path: str, output_base_dir: str = "data") -> Dict[str, Any]:
    """
    Parses a .pptx PowerPoint presentation, treats each slide as a page,
    extracts slide text, bullet points, and tables.
    """
    import pptx

    doc_name = os.path.basename(pptx_path)
    doc_id = generate_doc_id(pptx_path)

    pages_dir = os.path.join(output_base_dir, "pages", doc_id)
    processed_dir = os.path.join(output_base_dir, "processed")
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)

    prs = pptx.Presentation(pptx_path)
    total_pages = max(1, len(prs.slides))
    all_evidence: List[Evidence] = []
    evidence_counter = 1

    for slide_idx, slide in enumerate(prs.slides):
        page_num = slide_idx + 1
        slide_texts = []
        slide_tables = []
        slide_title = f"Slide {page_num}"

        for shape in slide.shapes:
            if shape.has_text_frame:
                text = shape.text_frame.text.strip()
                if text:
                    slide_texts.append(text)
                    if shape == slide.shapes.title and text:
                        slide_title = text[:50]
            elif shape.has_table:
                table = shape.table
                headers = [cell.text.strip() for cell in table.rows[0].cells]
                rows = []
                for row in table.rows[1:]:
                    rows.append([cell.text.strip() for cell in row.cells])
                slide_tables.append({"headers": headers, "rows": rows})

        page_img_path = os.path.join(pages_dir, f"page_{page_num}.png")
        render_text_to_page_image(
            title=f"{doc_name} - {slide_title}",
            paragraphs=slide_texts,
            tables=slide_tables,
            output_path=page_img_path,
            page_num=page_num,
            total_pages=total_pages
        )

        all_evidence.append(Evidence(
            evidence_id=f"E{evidence_counter:03d}",
            document_id=doc_id,
            document_name=doc_name,
            page=page_num,
            section=slide_title,
            type=EvidenceType.TEXT,
            text="\n".join(slide_texts),
            table=None,
            image_path=page_img_path,
            metadata={"slide_num": page_num}
        ))
        evidence_counter += 1

        for tab in slide_tables:
            all_evidence.append(Evidence(
                evidence_id=f"E{evidence_counter:03d}",
                document_id=doc_id,
                document_name=doc_name,
                page=page_num,
                section=f"{slide_title} Table",
                type=EvidenceType.TABLE,
                text=f"Table: {' | '.join(tab['headers'])}",
                table=TableData(headers=tab["headers"], rows=tab["rows"]),
                image_path=page_img_path,
                metadata={"rows_count": len(tab["rows"])}
            ))
            evidence_counter += 1

    processed_json_path = os.path.join(processed_dir, f"{doc_id}.json")
    resp_obj = DocumentProcessResponse(
        document_id=doc_id,
        document_name=doc_name,
        page_count=total_pages,
        evidence_count=len(all_evidence),
        evidence=all_evidence
    )
    with open(processed_json_path, "w", encoding="utf-8") as f:
        json.dump(resp_obj.model_dump(), f, indent=2)

    return resp_obj.model_dump()


def process_text_file(text_path: str, output_base_dir: str = "data") -> Dict[str, Any]:
    """Parses plain text (.txt, .md, .csv) documents."""
    doc_name = os.path.basename(text_path)
    doc_id = generate_doc_id(text_path)

    pages_dir = os.path.join(output_base_dir, "pages", doc_id)
    processed_dir = os.path.join(output_base_dir, "processed")
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)

    with open(text_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = [l.strip() for l in content.split("\n") if l.strip()]
    PAGE_SIZE = 25
    line_chunks = [lines[i:i + PAGE_SIZE] for i in range(0, max(1, len(lines)), PAGE_SIZE)]
    total_pages = len(line_chunks)

    all_evidence = []
    evidence_counter = 1

    for p_idx, p_lines in enumerate(line_chunks):
        page_num = p_idx + 1
        page_img_path = os.path.join(pages_dir, f"page_{page_num}.png")
        render_text_to_page_image(
            title=doc_name,
            paragraphs=p_lines,
            tables=[],
            output_path=page_img_path,
            page_num=page_num,
            total_pages=total_pages
        )

        all_evidence.append(Evidence(
            evidence_id=f"E{evidence_counter:03d}",
            document_id=doc_id,
            document_name=doc_name,
            page=page_num,
            section=p_lines[0][:40] if p_lines else f"Page {page_num}",
            type=EvidenceType.TEXT,
            text="\n".join(p_lines),
            table=None,
            image_path=page_img_path,
            metadata={"char_count": sum(len(l) for l in p_lines)}
        ))
        evidence_counter += 1

    processed_json_path = os.path.join(processed_dir, f"{doc_id}.json")
    resp_obj = DocumentProcessResponse(
        document_id=doc_id,
        document_name=doc_name,
        page_count=total_pages,
        evidence_count=len(all_evidence),
        evidence=all_evidence
    )
    with open(processed_json_path, "w", encoding="utf-8") as f:
        json.dump(resp_obj.model_dump(), f, indent=2)

    return resp_obj.model_dump()


def ingest_any_file(file_path: str, output_base_dir: str = "data") -> Dict[str, Any]:
    """
    Universal ingestion entry point: automatically detects file format
    (.pdf, .docx, .pptx, .txt, .md, .csv) and invokes the appropriate parser.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return process_pdf_document(file_path, output_base_dir=output_base_dir)
    elif ext in [".docx", ".doc"]:
        return process_docx_file(file_path, output_base_dir=output_base_dir)
    elif ext in [".pptx", ".ppt"]:
        return process_pptx_file(file_path, output_base_dir=output_base_dir)
    elif ext in [".txt", ".md", ".csv", ".json"]:
        return process_text_file(file_path, output_base_dir=output_base_dir)
    else:
        # Fallback to text parsing
        return process_text_file(file_path, output_base_dir=output_base_dir)
