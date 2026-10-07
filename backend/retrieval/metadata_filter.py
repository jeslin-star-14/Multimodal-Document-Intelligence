import os
import glob
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

def format_evidence_search_text(evidence_dict: Dict[str, Any]) -> str:
    """
    Constructs a rich searchable textual representation for an evidence object.
    
    - For text/ocr: uses evidence["text"]
    - For tables: formats headers and rows into markdown table format
    - For charts/graphs/images: combines section title, type, and existing text
    """
    ev_type = evidence_dict.get("type", "text")
    section = evidence_dict.get("section") or ""
    doc_name = evidence_dict.get("document_name") or ""
    
    parts = []
    if section:
        parts.append(f"Section: {section}")

    if ev_type == "table" and evidence_dict.get("table"):
        table = evidence_dict["table"]
        headers = table.get("headers", [])
        rows = table.get("rows", [])
        
        table_text_lines = []
        if headers:
            table_text_lines.append(" | ".join(headers))
        for row in rows:
            table_text_lines.append(" | ".join(row))
        
        table_str = "\n".join(table_text_lines)
        parts.append(f"Table Data:\n{table_str}")
    else:
        text = evidence_dict.get("text", "").strip()
        if text:
            parts.append(text)
        else:
            # For image/chart/graph with no explicit text
            parts.append(f"[{ev_type.upper()} visual content on page {evidence_dict.get('page')}]")

    return "\n".join(parts)

def filter_evidence_list(
    evidence_items: List[Dict[str, Any]],
    document_ids: Optional[List[str]] = None,
    types: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Filters evidence items by document_ids (matching ID or filename) and/or types.
    """
    filtered = []
    doc_tokens = set([d.lower().strip() for d in document_ids]) if document_ids else None
    type_set = set([t.lower().strip() for t in types]) if types else None

    for item in evidence_items:
        if doc_tokens:
            item_id = (item.get("document_id") or "").lower().strip()
            item_name = (item.get("document_name") or "").lower().strip()
            # Match if document_id matches, or filename matches, or partial name match
            match_doc = (
                item_id in doc_tokens or 
                item_name in doc_tokens or 
                any(t in item_name for t in doc_tokens) or 
                any(item_name and item_name in t for t in doc_tokens)
            )
            if not match_doc:
                continue

        if type_set:
            item_type = (item.get("type") or "").lower().strip()
            if item_type not in type_set:
                continue

        filtered.append(item)
        
    return filtered

def get_evidence_page(evidence_id: str, processed_dir: str = "data/processed") -> Optional[Dict[str, Any]]:
    """
    Helper returning document name, page number, image path, type, section, and evidence ID
    for frontend 'View Evidence' page rendering.
    """
    pattern = os.path.join(processed_dir, "*.json")
    for file_path in glob.glob(pattern):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                doc_data = json.load(f)
                for item in doc_data.get("evidence", []):
                    if item.get("evidence_id") == evidence_id:
                        return {
                            "evidence_id": item.get("evidence_id"),
                            "document_id": item.get("document_id"),
                            "document_name": item.get("document_name"),
                            "page": item.get("page"),
                            "section": item.get("section"),
                            "type": item.get("type"),
                            "image_path": item.get("image_path"),
                            "text": item.get("text"),
                            "table": item.get("table"),
                            "metadata": item.get("metadata", {})
                        }
        except Exception as e:
            logger.warning(f"Error reading JSON file {file_path}: {e}")
            continue
    return None
