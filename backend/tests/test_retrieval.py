import os
import sys
import json
import pytest
import pymupdf
from PIL import Image, ImageDraw

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ingestion.pipeline import process_document
from retrieval.indexer import index_document, LocalVectorIndex
from retrieval.retriever import retrieve
from retrieval.metadata_filter import get_evidence_page

def create_sample_pdf_with_table_and_text(pdf_path: str):
    """Creates a sample PDF with normal text and numerical data."""
    doc = fitz.open()
    
    # Page 1: Production Report
    p1 = doc.new_page()
    p1.insert_text((50, 50), "Production Efficiency Report 2026", fontsize=18)
    p1.insert_text((50, 90), "Production efficiency increased from 71% in Q2 to 84% in Q4.", fontsize=11)
    
    # Page 2: Financial Metrics
    p2 = doc.new_page()
    p2.insert_text((50, 50), "Quarterly Financial Overview", fontsize=16)
    p2.insert_text((50, 90), "Total operating cost reached $4,250,000 with revenue up 24%.", fontsize=11)

    doc.save(pdf_path)
    doc.close()

def create_second_pdf(pdf_path: str):
    """Creates a second PDF for cross-document testing."""
    doc = fitz.open()
    p1 = doc.new_page()
    p1.insert_text((50, 50), "Operations Operations Report", fontsize=18)
    p1.insert_text((50, 90), "Factory automation reduced downtime by 15% in Q4.", fontsize=11)
    doc.save(pdf_path)
    doc.close()

def test_indexing_and_single_doc_retrieval(tmp_path):
    pdf1 = str(tmp_path / "prod_report.pdf")
    data_dir = str(tmp_path / "data")
    index_dir = os.path.join(data_dir, "index")

    create_sample_pdf_with_table_and_text(pdf1)

    # 1. Process PDF
    res1 = process_document(pdf1, output_base_dir=data_dir)
    assert res1["success"] is True

    # 2. Index Document
    added = index_document(res1, index_dir=index_dir)
    assert added > 0

    # 3. Prevent Duplicates on Re-indexing
    re_added = index_document(res1, index_dir=index_dir)
    assert re_added == 0, "Re-indexing same document must not create duplicate entries"

    # 4. Single Document Search for numerical query
    results = retrieve("Q4 production efficiency 84%", top_k=5, index_dir=index_dir)
    assert len(results) > 0
    top_result = results[0]
    assert top_result["document_id"] == res1["document_id"]
    assert "84%" in top_result["text"] or "Q4" in top_result["text"]
    assert os.path.exists(top_result["image_path"])

def test_cross_document_retrieval(tmp_path):
    pdf1 = str(tmp_path / "docA.pdf")
    pdf2 = str(tmp_path / "docB.pdf")
    data_dir = str(tmp_path / "data")
    index_dir = os.path.join(data_dir, "index")

    create_sample_pdf_with_table_and_text(pdf1)
    create_second_pdf(pdf2)

    res1 = process_document(pdf1, output_base_dir=data_dir)
    res2 = process_document(pdf2, output_base_dir=data_dir)

    index_document(res1, index_dir=index_dir)
    index_document(res2, index_dir=index_dir)

    # Cross-document search
    results = retrieve("automation downtime Q4", top_k=5, index_dir=index_dir)
    doc_ids = {r["document_id"] for r in results}
    assert res2["document_id"] in doc_ids

def test_document_and_type_filtering(tmp_path):
    pdf1 = str(tmp_path / "docA.pdf")
    pdf2 = str(tmp_path / "docB.pdf")
    data_dir = str(tmp_path / "data")
    index_dir = os.path.join(data_dir, "index")

    create_sample_pdf_with_table_and_text(pdf1)
    create_second_pdf(pdf2)

    res1 = process_document(pdf1, output_base_dir=data_dir)
    res2 = process_document(pdf2, output_base_dir=data_dir)

    index_document(res1, index_dir=index_dir)
    index_document(res2, index_dir=index_dir)

    # Filter by document_ids
    filtered_doc = retrieve("Q4", document_ids=[res1["document_id"]], top_k=5, index_dir=index_dir)
    for item in filtered_doc:
        assert item["document_id"] == res1["document_id"]

    # Filter by type
    filtered_type = retrieve("Q4", types=["text"], top_k=5, index_dir=index_dir)
    for item in filtered_type:
        assert item["type"] == "text"

def test_get_evidence_page_helper(tmp_path):
    pdf1 = str(tmp_path / "docA.pdf")
    data_dir = str(tmp_path / "data")
    processed_dir = os.path.join(data_dir, "processed")

    create_sample_pdf_with_table_and_text(pdf1)
    res1 = process_document(pdf1, output_base_dir=data_dir)

    first_ev_id = res1["evidence"][0]["evidence_id"]
    page_details = get_evidence_page(first_ev_id, processed_dir=processed_dir)

    assert page_details is not None
    assert page_details["evidence_id"] == first_ev_id
    assert page_details["page"] == 1
    assert os.path.exists(page_details["image_path"])

if __name__ == "__main__":
    pytest.main(["-v", __file__])
