import os
import glob
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Path as APIPath, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from schemas.evidence import DocumentProcessResponse, Evidence
from ingestion.pipeline import process_document
from retrieval.indexer import index_document, get_vector_index
from retrieval.retriever import retrieve
from retrieval.metadata_filter import get_evidence_page

# Optional imports for reasoning & app config if present
try:
    from app.models.schemas import (
        QueryRequest as FrontendQueryRequest, 
        QueryResponse as FrontendQueryResponse, 
        Citation as FrontendCitation,
        BoundingBox as FrontendBoundingBox,
        DocumentMetadata
    )
    from app.config import (
        CORS_ORIGINS, 
        UPLOAD_DIR as APP_UPLOAD_DIR, 
        CROPS_DIR, 
        PAGES_DIR as APP_PAGES_DIR, 
        BASE_DIR as APP_BASE_DIR
    )
    from app.models import QueryRequest, QueryResponse
    from app.retriever import retriever as app_retriever
    from app.reasoning import reasoning_engine
    HAS_REASONING_MODULE = True
except ImportError:
    HAS_REASONING_MODULE = False

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multimodal Document Intelligence API",
    description="Multimodal Document Intelligence - Ingestion, Retrieval, & Visual RAG Service",
    version="2.0.0"
)

# Enable CORS for frontend Vite dev server
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
INDEX_DIR = os.path.join(DATA_DIR, "index")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(PAGES_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(INDEX_DIR, exist_ok=True)

# Static file mounts for visual evidence inspector
app.mount("/data/pages", StaticFiles(directory=PAGES_DIR), name="pages")

if HAS_REASONING_MODULE:
    try:
        app.mount("/api/assets/crops", StaticFiles(directory=str(CROPS_DIR)), name="crops")
        app.mount("/api/assets/pages", StaticFiles(directory=str(APP_PAGES_DIR)), name="app_pages")
        DEMO_DIR = Path(BASE_DIR) / "data" / "demo"
        DEMO_DIR.mkdir(parents=True, exist_ok=True)
        app.mount("/api/assets/demo", StaticFiles(directory=str(DEMO_DIR)), name="demo")
    except Exception as e:
        logger.warning(f"Static file mount warning: {e}")

# Request Schemas
class SearchQueryRequest(BaseModel):
    question: str = Field(..., description="User search query or question")
    top_k: int = Field(8, description="Maximum number of evidence results to return")
    document_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to filter by")
    types: Optional[List[str]] = Field(None, description="Optional list of evidence types to filter by")

class IndexDocumentRequest(BaseModel):
    document_id: str = Field(..., description="Document ID of an already processed document")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Multimodal Document Intelligence Engine",
        "endpoints": [
            "POST /upload",
            "POST /search",
            "POST /index",
            "GET /documents/{document_id}",
            "GET /evidence/{evidence_id}",
            "GET /evidence/{evidence_id}/page",
            "GET /health"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Multimodal Document Intelligence API",
        "version": "2.0.0"
    }

@app.post("/upload")
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, saves it to data/uploads/, runs the ingestion pipeline,
    indexes the extracted evidence, and returns document summary metadata.
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
        # 1. Execute ingestion pipeline
        result = process_document(target_pdf_path, output_base_dir=DATA_DIR)
        
        # 2. Index processed evidence for hybrid retrieval
        indexed_count = index_document(result, index_dir=INDEX_DIR)
        logger.info(f"Indexed {indexed_count} evidence items for {result['document_id']}")

        return {
            "success": True,
            "document_id": result["document_id"],
            "document_name": result["document_name"],
            "page_count": result["page_count"],
            "evidence_count": result["evidence_count"],
            "indexed_count": indexed_count,
            "id": result["document_id"],
            "name": result["document_name"],
            "status": "Ready",
            "message": "Document parsed and embedded with visual grounding coordinates."
        }
    except Exception as e:
        logger.error(f"Error processing uploaded PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/index")
def index_existing_document(req: IndexDocumentRequest):
    """
    Indexes an existing processed document by document_id.
    """
    json_path = os.path.join(PROCESSED_DIR, f"{req.document_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail=f"Processed document '{req.document_id}' not found.")
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            doc_result = json.load(f)
        indexed_count = index_document(doc_result, index_dir=INDEX_DIR)
        return {
            "success": True,
            "document_id": req.document_id,
            "indexed_count": indexed_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@app.post("/search")
def search_evidence(req: SearchQueryRequest):
    """
    Executes hybrid multimodal retrieval across indexed evidence objects.
    """
    try:
        results = retrieve(
            question=req.question,
            top_k=req.top_k,
            document_ids=req.document_ids,
            types=req.types,
            index_dir=INDEX_DIR
        )
        return {
            "success": True,
            "query": req.question,
            "results": results
        }
    except Exception as e:
        logger.error(f"Search retrieval error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/documents/{document_id}")
def get_document_metadata(document_id: str = APIPath(..., description="Unique Document ID")):
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
def get_evidence_item(evidence_id: str = APIPath(..., description="Unique Evidence ID e.g., E001")):
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

@app.get("/evidence/{evidence_id}/page")
def get_evidence_page_details(evidence_id: str = APIPath(..., description="Unique Evidence ID")):
    """
    Returns page display details for frontend 'View Evidence' page rendering.
    """
    page_details = get_evidence_page(evidence_id, processed_dir=PROCESSED_DIR)
    if not page_details:
        raise HTTPException(status_code=404, detail=f"Evidence page details not found for ID '{evidence_id}'.")
    return page_details

if HAS_REASONING_MODULE:
    @app.post("/api/chat/query", response_model=FrontendQueryResponse)
    async def query_documents_chat(request: FrontendQueryRequest):
        chunks = await app_retriever.search(
            query=request.query,
            doc_names=[request.document_id] if request.document_id else None,
            top_k=5
        )
        result = await reasoning_engine.generate_multimodal_answer(
            query=request.query,
            chunks=chunks
        )

        frontend_citations: List[FrontendCitation] = []
        for cit in result.citations:
            if cit.bbox and len(cit.bbox) == 4:
                x0, y0, x1, y1 = cit.bbox
                pw = 800.0 if x1 > 100 else 1.0
                ph = 1050.0 if y1 > 100 else 1.0
                pct_x = round((x0 / pw) * 100, 1)
                pct_y = round((y0 / ph) * 100, 1)
                pct_w = round(((x1 - x0) / pw) * 100, 1)
                pct_h = round(((y1 - y0) / ph) * 100, 1)
            else:
                pct_x, pct_y, pct_w, pct_h = 12.0, 25.0, 75.0, 35.0

            c_type = cit.type if cit.type in ["text", "table", "chart"] else "image"

            frontend_citations.append(FrontendCitation(
                id=f"cit-{cit.citation_id}",
                document_id=cit.doc_name,
                document_name=cit.doc_name,
                page_number=cit.page_number,
                chunk_type=c_type,
                label=f"{cit.section} (Page {cit.page_number})",
                chunk_id=f"chunk-{cit.citation_id}",
                similarity_score=cit.confidence,
                bounding_box=FrontendBoundingBox(
                    id=f"bbox-{cit.citation_id}",
                    x=pct_x,
                    y=pct_y,
                    width=pct_w,
                    height=pct_h,
                    label=f"Evidence {cit.citation_id}: {cit.section}",
                    type=c_type,
                    color="#6366f1" if c_type == "text" else ("#10b981" if c_type == "table" else "#f59e0b")
                )
            ))

        return FrontendQueryResponse(
            text=result.answer,
            confidence_score=int(result.confidence_score * 100) if result.confidence_score <= 1.0 else int(result.confidence_score),
            citations=frontend_citations,
            not_found=False
        )

    @app.post("/api/query")
    async def query_multimodal_rag(request: QueryRequest):
        chunks = await app_retriever.search(
            query=request.query,
            doc_names=request.doc_names,
            top_k=request.top_k
        )
        return await reasoning_engine.generate_multimodal_answer(
            query=request.query,
            chunks=chunks
        )

    @app.get("/api/benchmark/demo")
    async def get_benchmark_demo():
        return reasoning_engine._build_benchmark_demo_response(
            query="Compare production efficiency between Q2 and Q4, identify the three biggest reasons for the change, and show me the proof.",
            start_time=0
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
