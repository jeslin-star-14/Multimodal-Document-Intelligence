import logging
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

def extract_tables_pdfplumber(pdf_path: str, page_number_1based: int) -> List[Dict[str, Any]]:
    """
    Attempts table extraction using pdfplumber for a specific 1-indexed page.
    """
    tables_data = []
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            if page_number_1based <= len(pdf.pages):
                page = pdf.pages[page_number_1based - 1]
                extracted_tables = page.extract_tables()
                for raw_table in extracted_tables:
                    if not raw_table or len(raw_table) < 1:
                        continue
                    # First non-empty row as header candidate
                    headers = [str(cell).strip() if cell is not None else "" for cell in raw_table[0]]
                    rows = []
                    for r in raw_table[1:]:
                        row_cells = [str(cell).strip() if cell is not None else "" for cell in r]
                        if any(row_cells):  # ignore empty rows
                            rows.append(row_cells)
                    
                    if headers or rows:
                        tables_data.append({
                            "headers": headers,
                            "rows": rows
                        })
    except Exception as e:
        logger.warning(f"pdfplumber table extraction failed for page {page_number_1based}: {e}")
    return tables_data

def extract_tables_fitz(page: fitz.Page) -> List[Dict[str, Any]]:
    """
    Fallback table extraction using PyMuPDF (fitz) built-in table finder.
    """
    tables_data = []
    try:
        tabs = page.find_tables()
        for tab in tabs:
            extracted = tab.extract()
            if not extracted or len(extracted) < 1:
                continue
            headers = [str(cell).strip() if cell is not None else "" for cell in extracted[0]]
            rows = []
            for r in extracted[1:]:
                row_cells = [str(cell).strip() if cell is not None else "" for cell in r]
                if any(row_cells):
                    rows.append(row_cells)
            if headers or rows:
                tables_data.append({
                    "headers": headers,
                    "rows": rows
                })
    except Exception as e:
        logger.debug(f"PyMuPDF table extraction exception: {e}")
    return tables_data

def extract_tables_from_page(pdf_path: str, page: fitz.Page, page_number_1based: int) -> List[Dict[str, Any]]:
    """
    Extracts tables from a PDF page using pdfplumber with PyMuPDF fallback.
    Returns list of table objects: [{"headers": [...], "rows": [[...]]}]
    """
    # Try pdfplumber first
    tables = extract_tables_pdfplumber(pdf_path, page_number_1based)
    if not tables:
        # Fallback to PyMuPDF find_tables
        tables = extract_tables_fitz(page)
    
    if tables:
        logger.info(f"Extracted {len(tables)} table(s) on page {page_number_1based}.")
    return tables
