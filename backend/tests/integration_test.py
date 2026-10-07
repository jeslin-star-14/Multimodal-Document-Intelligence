import os
import sys
import pymupdf

# Ensure backend directory in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ingestion.pipeline import process_document
from retrieval.indexer import index_document
from retrieval.retriever import retrieve

def run_integration_test():
    print("==================================================")
    print("  MULTIMODAL EVIDENCE RETRIEVAL INTEGRATION TEST  ")
    print("==================================================")

    data_dir = os.path.join(backend_dir, "data")
    uploads_dir = os.path.join(data_dir, "uploads")
    index_dir = os.path.join(data_dir, "index")
    os.makedirs(uploads_dir, exist_ok=True)

    # 1. Generate sample production report PDF
    pdf_path = os.path.join(uploads_dir, "production_report.pdf")
    doc = fitz.open()
    
    # Page 1: Text & Numbers
    p1 = doc.new_page()
    p1.insert_text((50, 50), "Production Efficiency Report Q4", fontsize=18)
    p1.insert_text((50, 90), "Production efficiency increased from 71% in Q2 to 84% in Q4.", fontsize=11)
    
    # Page 2: Operational Data
    p2 = doc.new_page()
    p2.insert_text((50, 50), "Factory Throughput & Cost Analysis", fontsize=16)
    p2.insert_text((50, 90), "Q4 total output reached 12,200 units with operating expenses at $4,250,000.", fontsize=11)
    
    doc.save(pdf_path)
    doc.close()

    print(f"\n[1] Created sample PDF: {pdf_path}")

    # 2. Process Document Ingestion
    print("\n[2] Executing process_document()...")
    doc_result = process_document(pdf_path, output_base_dir=data_dir)
    print(f"    Document ID: {doc_result['document_id']}")
    print(f"    Total Pages: {doc_result['page_count']}")
    print(f"    Evidence Objects: {doc_result['evidence_count']}")

    # 3. Index Document
    print("\n[3] Executing index_document()...")
    indexed_count = index_document(doc_result, index_dir=index_dir)
    print(f"    Indexed Evidence Items: {indexed_count}")

    # 4. Search Query
    query = "Compare Q2 and Q4 production efficiency"
    print(f"\n[4] Executing retrieve('{query}')...")
    results = retrieve(query, top_k=5, index_dir=index_dir)

    print("\n==================================================")
    print(f"RETRIEVAL RESULTS FOR: '{query}'")
    print("==================================================")
    
    for r in results:
        print(f"\n- EVIDENCE ID : {r['evidence_id']}")
        print(f"  DOCUMENT    : {r['document_name']} ({r['document_id']})")
        print(f"  PAGE        : {r['page']}")
        print(f"  SECTION     : {r['section']}")
        print(f"  TYPE        : {r['type']}")
        print(f"  SCORE       : {r['score']}")
        print(f"  IMAGE PATH  : {r['image_path']}")
        if r['text']:
            print(f"  TEXT        : {r['text'][:120]}...")

    print("\n==================================================")
    print("  INTEGRATION TEST PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_integration_test()
