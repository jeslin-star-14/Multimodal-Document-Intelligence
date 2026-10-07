import os
import json
import uuid
import hashlib
import logging
from typing import Dict, Any, List, Optional

from schemas.evidence import Evidence, DocumentProcessResponse, TableData, EvidenceType
from ingestion.pdf_parser import PDFParser
from ingestion.page_renderer import render_page_to_image
from ingestion.text_extractor import extract_text_from_page
from ingestion.table_extractor import extract_tables_from_page
from ingestion.ocr import perform_ocr_on_image
from ingestion.content_detector import detect_visual_content

# Configure logging
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def generate_document_id(pdf_path: str) -> str:
    """Generates a stable, unique Document ID for a given PDF file path."""
    filename = os.path.basename(pdf_path)
    file_hash = hashlib.md5(f"{filename}_{os.path.getsize(pdf_path)}".encode()).hexdigest()[:6].upper()
    return f"DOC_{file_hash}"

def process_document(pdf_path: str, output_base_dir: str = "data") -> Dict[str, Any]:
    """
    Main ingestion pipeline processing a PDF document end-to-end.
    
    Args:
        pdf_path: Absolute or relative path to the input PDF file.
        output_base_dir: Base directory to store page images and processed JSONs.
        
    Returns:
        Structured dict with document_id, document_name, page_count, evidence_count, evidence list.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Input PDF not found: {pdf_path}")

    doc_name = os.path.basename(pdf_path)
    doc_id = generate_document_id(pdf_path)

    logger.info(f"Processing document: {doc_name}")
    logger.info(f"Document ID: {doc_id}")

    pages_dir = os.path.join(output_base_dir, "pages", doc_id)
    processed_dir = os.path.join(output_base_dir, "processed")
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)

    all_evidence: List[Evidence] = []
    evidence_counter = 1

    with PDFParser(pdf_path) as parser:
        total_pages = parser.page_count
        logger.info(f"Total pages detected: {total_pages}")

        for page_idx in range(total_pages):
            page_num = page_idx + 1  # 1-indexed page number
            logger.info(f"Processing page {page_num}/{total_pages}")

            try:
                page = parser.get_page(page_idx)

                # 1. Render page image to disk
                image_path = render_page_to_image(page, pages_dir, page_num)
                logger.info(f"Page image saved")

                # 2. Extract text & detect section
                extracted_text, detected_section = extract_text_from_page(page)

                # 3. Detect if scanned or low text -> OCR Fallback
                is_scanned = len(extracted_text.strip()) < 30
                
                if is_scanned:
                    logger.info("OCR required")
                    ocr_text = perform_ocr_on_image(image_path)
                    ev_id = f"E{evidence_counter:03d}"
                    evidence_counter += 1
                    
                    evidence_item = Evidence(
                        evidence_id=ev_id,
                        document_id=doc_id,
                        document_name=doc_name,
                        page=page_num,
                        section=detected_section,
                        type="ocr",
                        text=ocr_text,
                        table=None,
                        image_path=image_path,
                        metadata={"scanned": True, "char_count": len(ocr_text)}
                    )
                    all_evidence.append(evidence_item)
                else:
                    logger.info("Text extracted")
                    ev_id = f"E{evidence_counter:03d}"
                    evidence_counter += 1
                    
                    evidence_item = Evidence(
                        evidence_id=ev_id,
                        document_id=doc_id,
                        document_name=doc_name,
                        page=page_num,
                        section=detected_section,
                        type="text",
                        text=extracted_text,
                        table=None,
                        image_path=image_path,
                        metadata={"scanned": False, "char_count": len(extracted_text)}
                    )
                    all_evidence.append(evidence_item)

                # 4. Extract tables when possible
                tables = extract_tables_from_page(pdf_path, page, page_num)
                has_tables = len(tables) > 0

                for tab_data in tables:
                    logger.info("Table detected")
                    ev_id = f"E{evidence_counter:03d}"
                    evidence_counter += 1

                    table_obj = TableData(headers=tab_data["headers"], rows=tab_data["rows"])
                    table_evidence = Evidence(
                        evidence_id=ev_id,
                        document_id=doc_id,
                        document_name=doc_name,
                        page=page_num,
                        section=detected_section,
                        type="table",
                        text="",
                        table=table_obj,
                        image_path=image_path,
                        metadata={"row_count": len(tab_data["rows"]), "col_count": len(tab_data["headers"])}
                    )
                    all_evidence.append(table_evidence)

                # 5. Detect visual content (chart, graph, image)
                visual_detections = detect_visual_content(page, extracted_text, has_tables)
                for vis in visual_detections:
                    if vis["type"] == "table":
                        continue  # Already handled table above
                    
                    ev_id = f"E{evidence_counter:03d}"
                    evidence_counter += 1

                    vis_type: EvidenceType = vis["type"]
                    visual_evidence = Evidence(
                        evidence_id=ev_id,
                        document_id=doc_id,
                        document_name=doc_name,
                        page=page_num,
                        section=detected_section,
                        type=vis_type,
                        text="",
                        table=None,
                        image_path=image_path,
                        metadata={"confidence": vis["confidence"], "detection_details": vis["details"]}
                    )
                    all_evidence.append(visual_evidence)

            except Exception as e:
                logger.error(f"Error processing page {page_num} of {doc_name}: {e}", exc_info=True)
                # Continue processing remaining pages safely

    logger.info("Document processing complete")

    # Serialize structured result
    result_data = {
        "success": True,
        "document_id": doc_id,
        "document_name": doc_name,
        "page_count": total_pages,
        "evidence_count": len(all_evidence),
        "evidence": [ev.model_dump() for ev in all_evidence]
    }

    # Save processed JSON file
    json_path = os.path.join(processed_dir, f"{doc_id}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved processed metadata JSON to {json_path}")
    return result_data
