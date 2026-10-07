import os
import glob
import json
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from schemas.evidence import DocumentProcessResponse, Evidence
from ingestion.pipeline import process_document

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multimodal Document Intelligence - Ingestion Service",
    description="Document Ingestion Pipeline API extracting text, tables, visual content, and evidence objects from PDF documents.",
    version="1.0.0"
)

# Enable CORS for frontend or local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
PAGES_DIR = os.path.join(DATA_DIR, "pages")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(PAGES_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Static file serving for rendered page images
app.mount("/data/pages", StaticFiles(directory=PAGES_DIR), name="pages")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Multimodal Document Ingestion Pipeline",
        "endpoints": ["POST /upload", "GET /documents/{document_id}", "GET /evidence/{evidence_id}"]
    }

@app.post("/upload")
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, saves it to data/uploads/, runs the ingestion pipeline,
    and returns document summary metadata.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    target_pdf_path = os.path.join(UPLOADS_DIR, file.filename)
    
    try:
        content = await file.read()
        with open(target_pdf_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved uploaded PDF to {target_pdf_path}")
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    try:
        # Execute processing pipeline
        result = process_document(target_pdf_path, output_base_dir=DATA_DIR)
        
        return {
            "success": True,
            "document_id": result["document_id"],
            "document_name": result["document_name"],
            "page_count": result["page_count"],
            "evidence_count": result["evidence_count"]
        }
    except Exception as e:
        logger.error(f"Error processing uploaded PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/documents/{document_id}")
def get_document_metadata(document_id: str = Path(..., description="Unique Document ID")):
    """
    Returns full processed document metadata and list of extracted evidence objects.
    """
    json_path = os.path.join(PROCESSED_DIR, f"{document_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail=f"Document with ID '{document_id}' not found.")
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read document metadata: {str(e)}")

@app.get("/evidence/{evidence_id}")
def get_evidence_item(evidence_id: str = Path(..., description="Unique Evidence ID e.g., E001")):
    """
    Returns the specific evidence object corresponding to the given evidence_id across all processed documents.
    """
    processed_files = glob.glob(os.path.join(PROCESSED_DIR, "*.json"))
    for file_path in processed_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                doc_data = json.load(f)
                for item in doc_data.get("evidence", []):
                    if item.get("evidence_id") == evidence_id:
                        return item
        except Exception as e:
            logger.warning(f"Error reading file {file_path}: {e}")
            continue

    raise HTTPException(status_code=404, detail=f"Evidence with ID '{evidence_id}' not found.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
