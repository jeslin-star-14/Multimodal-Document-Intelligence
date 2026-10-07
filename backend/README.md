# Document Ingestion Pipeline Module

Multimodal Document Intelligence RAG System — **Document Ingestion Module**.

This module processes mixed PDF documents containing text, tables, charts, graphs, images, and scanned pages. It extracts evidence units while strictly preserving document metadata, page numbers, sections, content types, and high-resolution page rendering PNGs.

---

## 1. Directory Structure

```
backend/
│
├── main.py                     # FastAPI Web Application & API endpoints
│
├── ingestion/
│   ├── __init__.py             # Module exports (process_document)
│   ├── pipeline.py             # Main processing workflow orchestration
│   ├── pdf_parser.py           # PyMuPDF wrapper & document structure reader
│   ├── text_extractor.py       # Text extraction & section heading detection
│   ├── table_extractor.py      # pdfplumber & PyMuPDF table extraction
│   ├── ocr.py                  # OCR fallback for scanned pages (PaddleOCR/EasyOCR/Tesseract)
│   ├── page_renderer.py        # High-res PDF page to PNG rendering
│   └── content_detector.py     # Heuristic detection for charts, graphs, images, & tables
│
├── schemas/
│   ├── __init__.py
│   └── evidence.py             # Pydantic schema models for Evidence & Responses
│
├── data/
│   ├── uploads/                # Uploaded PDF files
│   ├── pages/                  # Rendered page images (data/pages/{doc_id}/page_{page_num}.png)
│   └── processed/              # Processed JSON evidence metadata per document
│
├── tests/
│   └── test_ingestion.py       # PyTest suite for PDF ingestion pipeline
│
├── requirements.txt            # Python dependency requirements
└── README.md                   # Ingestion module documentation
```

---

## 2. Installation & Setup

### Requirements
- Python 3.10+
- PyMuPDF (`fitz`), pdfplumber, FastAPI, Pydantic, Pillow, OpenCV

```bash
cd backend
pip install -r requirements.txt
```

---

## 3. Running FastAPI Server

Start the backend server using `uvicorn`:

```bash
cd backend
python main.py
```
Or:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

---

## 4. API Endpoints

### 1. Upload & Process PDF
- **Endpoint**: `POST /upload` (or `POST /api/documents/upload`)
- **Body**: `multipart/form-data` with `file: <pdf_file>`
- **Response**:
```json
{
  "success": true,
  "document_id": "DOC_A1B2C3",
  "document_name": "production_report.pdf",
  "page_count": 25,
  "evidence_count": 42
}
```

### 2. Get Document Metadata & Evidence List
- **Endpoint**: `GET /documents/{document_id}`
- **Response**:
```json
{
  "success": true,
  "document_id": "DOC_A1B2C3",
  "document_name": "production_report.pdf",
  "page_count": 25,
  "evidence_count": 42,
  "evidence": [
    {
      "evidence_id": "E001",
      "document_id": "DOC_A1B2C3",
      "document_name": "production_report.pdf",
      "page": 7,
      "section": "Production Efficiency",
      "type": "text",
      "text": "Production efficiency increased from 71% in Q2 to 84% in Q4.",
      "table": null,
      "image_path": "data/pages/DOC_A1B2C3/page_7.png",
      "metadata": { "scanned": false }
    }
  ]
}
```

### 3. Get Specific Evidence Item
- **Endpoint**: `GET /evidence/{evidence_id}`
- **Response**: Returns the single `Evidence` object matching `evidence_id`.

---

## 5. Evidence Schema

Each extracted item conforms to the Pydantic `Evidence` model:

```json
{
  "evidence_id": "E001",
  "document_id": "DOC001",
  "document_name": "production_report.pdf",
  "page": 18,
  "section": "Production Efficiency",
  "type": "chart",
  "text": "",
  "table": null,
  "image_path": "data/pages/DOC001/page_18.png",
  "metadata": {}
}
```

**Allowed `type` values**:
- `text`
- `table`
- `chart`
- `graph`
- `image`
- `ocr`

---

## 6. Integration Contract for RAG Team

The RAG developer can import and consume `process_document()` directly without needing to understand internal PDF/OCR logic:

```python
from ingestion.pipeline import process_document

# Execute document processing pipeline on a PDF file
result = process_document("data/uploads/production_report.pdf")

print(f"Document ID: {result['document_id']}")
print(f"Total Pages: {result['page_count']}")
print(f"Total Evidence Items: {result['evidence_count']}")

# Iterate through evidence items
for evidence in result["evidence"]:
    print(f"[{evidence['evidence_id']}] Page {evidence['page']} ({evidence['type']}): {evidence['section']}")
    if evidence["type"] == "text":
        print(f"   Text snippet: {evidence['text'][:100]}...")
    elif evidence["type"] == "table":
        print(f"   Headers: {evidence['table']['headers']}")
    elif evidence["type"] in ["chart", "graph", "image"]:
        print(f"   Image rendering: {evidence['image_path']}")
```
