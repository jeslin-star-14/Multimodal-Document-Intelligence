# Multimodal Document Ingestion & Retrieval Layer

Multimodal Document Intelligence RAG System — **Document Ingestion & Hybrid Evidence Retrieval Modules**.

This backend subsystem processes mixed PDF documents containing text, tables, charts, graphs, images, and scanned pages into structured evidence objects, and provides persistent vector indexing and hybrid multimodal retrieval for downstream reasoning modules.

---

## 1. Directory Structure

```
backend/
│
├── main.py                     # FastAPI Web Application (Upload, Search, Index, Evidence APIs)
│
├── ingestion/                  # Document Processing Pipeline Module
│   ├── __init__.py             # Exports process_document()
│   ├── pipeline.py             # Main processing workflow orchestration
│   ├── pdf_parser.py           # PyMuPDF wrapper & document structure reader
│   ├── text_extractor.py       # Text extraction & section heading detection
│   ├── table_extractor.py      # pdfplumber & PyMuPDF table extraction
│   ├── ocr.py                  # OCR fallback for scanned pages (PaddleOCR/EasyOCR/Tesseract)
│   ├── page_renderer.py        # High-res PDF page to PNG rendering
│   └── content_detector.py     # Heuristic detection for charts, graphs, images, & tables
│
├── retrieval/                  # Indexing & Hybrid Multimodal Retrieval Module
│   ├── __init__.py             # Exports index_document(), retrieve(), get_evidence_page()
│   ├── indexer.py              # Persistent FAISS / vector store & duplicate handling
│   ├── retriever.py            # Dense semantic + sparse BM25/numerical hybrid search
│   ├── embeddings.py           # SentenceTransformers (all-MiniLM-L6-v2) embedding manager
│   └── metadata_filter.py      # Table text representation & metadata filtering helpers
│
├── schemas/
│   ├── __init__.py
│   └── evidence.py             # Pydantic schema models for Evidence & Responses
│
├── data/
│   ├── uploads/                # Uploaded PDF files
│   ├── pages/                  # Rendered page PNGs (data/pages/{doc_id}/page_{page_num}.png)
│   ├── processed/              # Processed JSON evidence metadata per document
│   └── index/                  # Persistent FAISS vector index & metadata store
│
├── tests/
│   ├── test_ingestion.py       # PyTest suite for PDF ingestion pipeline
│   ├── test_retrieval.py       # PyTest suite for indexing & hybrid retrieval
│   └── integration_test.py    # End-to-end integration test runner
│
├── requirements.txt            # Python dependency requirements
└── README.md                   # Complete module documentation & VLM integration guide
```

---

## 2. Installation & Running

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Start FastAPI Backend
```bash
python main.py
```
Or:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation available at `http://localhost:8000/docs`.

---

## 3. Key Architecture & Features

1. **Document Ingestion Pipeline (`process_document`)**:
   - Page-level isolation (strictly preserves document ID, page number, section, and type).
   - High-resolution rendering to `data/pages/{document_id}/page_{page_number}.png`.
   - OCR fallback for scanned or image-heavy PDF pages.
   - Structured table extraction (`headers` & `rows`).
   - Heuristic detection of visual content (charts, graphs, images).

2. **Persistent Vector Indexing (`index_document`)**:
   - Embedding model: `all-MiniLM-L6-v2` via `sentence-transformers` (configurable & offline fallback).
   - Local persistent vector index stored in `data/index/`.
   - Prevents duplicate indexing using unique `(document_id, evidence_id)` keys.

3. **Hybrid Multimodal Retrieval (`retrieve`)**:
   - Combines 60% dense vector similarity with 40% keyword overlap & exact numerical token matching (preserves numbers, currencies `$4,250`, percentages `84%`, quarters `Q4`, dates `2026`).
   - Supports cross-document retrieval or targeted filtering by `document_ids` and `types`.
   - Preserves original page image paths (`image_path`) for downstream VLM visual analysis.

---

## 4. API Specification

### 1. Upload & Index PDF
- **Endpoint**: `POST /upload` (or `POST /api/documents/upload`)
- **Body**: `multipart/form-data` with `file: <pdf_file>`
- **Response**:
```json
{
  "success": true,
  "document_id": "DOC_62C934",
  "document_name": "production_report.pdf",
  "page_count": 25,
  "evidence_count": 42,
  "indexed_count": 42
}
```

### 2. Hybrid Evidence Search
- **Endpoint**: `POST /search`
- **Request Body**:
```json
{
  "question": "Compare Q2 and Q4 production efficiency.",
  "top_k": 8,
  "document_ids": ["DOC_62C934"],
  "types": ["text", "table", "chart"]
}
```
- **Response**:
```json
{
  "success": true,
  "query": "Compare Q2 and Q4 production efficiency.",
  "results": [
    {
      "evidence_id": "E001",
      "document_id": "DOC_62C934",
      "document_name": "production_report.pdf",
      "page": 1,
      "section": "Production Efficiency Report Q4",
      "type": "text",
      "text": "Production efficiency increased from 71% in Q2 to 84% in Q4.",
      "table": null,
      "image_path": "data/pages/DOC_62C934/page_1.png",
      "metadata": { "scanned": false, "char_count": 142 },
      "score": 0.6776
    }
  ]
}
```

### 3. Get Document Metadata
- **Endpoint**: `GET /documents/{document_id}`

### 4. Get Specific Evidence Object
- **Endpoint**: `GET /evidence/{evidence_id}`

### 5. Get Evidence Page Rendering Details
- **Endpoint**: `GET /evidence/{evidence_id}/page`

---

## 5. Integration Contract for VLM & Reasoning Team

The VLM / Reasoning developer can consume retrieved evidence directly via Python import or HTTP API:

```python
from retrieval.retriever import retrieve

# Query hybrid retrieval across all indexed documents
results = retrieve("Compare Q2 and Q4 production efficiency", top_k=5)

for item in results:
    print(f"[{item['evidence_id']}] Score: {item['score']} | Doc: {item['document_name']} | Page: {item['page']}")
    print(f"  Type: {item['type']} | Section: {item['section']}")
    print(f"  Image Path: {item['image_path']}")
    if item["type"] == "text":
        print(f"  Snippet: {item['text'][:100]}...")
    elif item["type"] == "table":
        print(f"  Headers: {item['table']['headers']}")
```
