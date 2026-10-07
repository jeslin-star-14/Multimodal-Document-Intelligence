import os
import sys
import json
import pytest
import pymupdf  # PyMuPDF
from PIL import Image, ImageDraw

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ingestion.pipeline import process_document
from schemas.evidence import Evidence

def create_sample_text_pdf(pdf_path: str):
    """Creates a sample PDF with normal selectable text and section headers."""
    doc = fitz.open()
    
    # Page 1
    page1 = doc.new_page()
    page1.insert_text((50, 50), "Production Efficiency Report", fontsize=18, color=(0, 0, 0))
    page1.insert_text((50, 90), "Production efficiency increased from 71% in Q2 to 84% in Q4.", fontsize=11)
    
    # Page 2
    page2 = doc.new_page()
    page2.insert_text((50, 50), "Quarterly Financial Analysis", fontsize=16, color=(0, 0, 0))
    page2.insert_text((50, 90), "Overall revenue surged by 24% year-over-year.", fontsize=11)
    
    doc.save(pdf_path)
    doc.close()

def create_sample_scanned_pdf(pdf_path: str):
    """Creates a synthetic scanned PDF (page image without text layer)."""
    # Create an image using PIL
    img = Image.new('RGB', (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((50, 50), "SCANNED INVOICE #99482", fill=(0, 0, 0))
    draw.text((50, 100), "Total Amount Due: $4,250.00", fill=(0, 0, 0))
    
    img_temp_path = pdf_path + ".png"
    img.save(img_temp_path)

    # Put image inside PDF without text layer
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    page.insert_image(page.rect, filename=img_temp_path)
    doc.save(pdf_path)
    doc.close()

    if os.path.exists(img_temp_path):
        os.remove(img_temp_path)

def test_text_pdf_ingestion(tmp_path):
    pdf_file = str(tmp_path / "sample_text.pdf")
    output_dir = str(tmp_path / "data")
    
    create_sample_text_pdf(pdf_file)
    
    result = process_document(pdf_file, output_base_dir=output_dir)
    
    assert result["success"] is True
    assert result["page_count"] == 2
    assert result["evidence_count"] >= 2
    assert result["document_name"] == "sample_text.pdf"
    assert result["document_id"].startswith("DOC_")

    # Check evidence IDs uniqueness
    ev_ids = [e["evidence_id"] for e in result["evidence"]]
    assert len(ev_ids) == len(set(ev_ids)), "Evidence IDs must be unique"

    # Check page image files exist
    for ev in result["evidence"]:
        assert os.path.exists(ev["image_path"]), f"Page image missing: {ev['image_path']}"
        assert ev["page"] in [1, 2]

def test_scanned_pdf_ingestion(tmp_path):
    pdf_file = str(tmp_path / "scanned_doc.pdf")
    output_dir = str(tmp_path / "data")

    create_sample_scanned_pdf(pdf_file)

    result = process_document(pdf_file, output_base_dir=output_dir)

    assert result["success"] is True
    assert result["page_count"] == 1
    
    # Check that OCR was triggered or type is ocr
    ocr_ev = [e for e in result["evidence"] if e["type"] == "ocr"]
    assert len(ocr_ev) > 0, "Scanned page should generate OCR evidence object"
    assert os.path.exists(ocr_ev[0]["image_path"])

def test_json_serialization(tmp_path):
    pdf_file = str(tmp_path / "test_serialize.pdf")
    output_dir = str(tmp_path / "data")

    create_sample_text_pdf(pdf_file)
    result = process_document(pdf_file, output_base_dir=output_dir)

    # Verify JSON can be serialized and deserialized
    json_str = json.dumps(result)
    loaded = json.loads(json_str)
    assert loaded["document_id"] == result["document_id"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
