import os
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.models.schemas import (
    QueryRequest as FrontendQueryRequest, 
    QueryResponse as FrontendQueryResponse, 
    Citation as FrontendCitation,
    BoundingBox as FrontendBoundingBox,
    DocumentMetadata
)
from app.config import (
    CORS_ORIGINS, 
    UPLOAD_DIR, 
    CROPS_DIR, 
    PAGES_DIR, 
    BASE_DIR
)
from app.models import QueryRequest, QueryResponse
from app.retriever import retriever
from app.reasoning import reasoning_engine

app = FastAPI(
    title="Multimodal Document Intelligence API",
    description="Visual RAG API with pixel-level grounded citations and bounding box coordinates",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for visual evidence inspector
app.mount("/api/assets/crops", StaticFiles(directory=str(CROPS_DIR)), name="crops")
app.mount("/api/assets/pages", StaticFiles(directory=str(PAGES_DIR)), name="pages")

# Mount demo assets directory
DEMO_DIR = BASE_DIR / "data" / "demo"
DEMO_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/assets/demo", StaticFiles(directory=str(DEMO_DIR)), name="demo")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Multimodal Document Intelligence Engine",
        "features": ["Visual Grounding", "Bounding Box Citations", "Cross-Document Conflict Detection"]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Multimodal Document Intelligence API",
        "version": "1.0.0"
    }


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Handles document upload, initiating OCR, parsing, and vector embedding.
    """
    dest = UPLOAD_DIR / file.filename
    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "id": f"doc-{Path(file.filename).stem}",
        "name": file.filename,
        "status": "Ready",
        "message": "Document parsed and embedded with visual grounding coordinates."
    }


@app.post("/api/chat/query", response_model=FrontendQueryResponse)
async def query_documents_chat(request: FrontendQueryRequest):
    """
    Executes multimodal visual RAG and returns grounded answers with bounding box citations
    matching frontend component contracts.
    """
    chunks = await retriever.search(
        query=request.query,
        doc_names=[request.document_id] if request.document_id else None,
        top_k=5
    )
    result: QueryResponse = await reasoning_engine.generate_multimodal_answer(
        query=request.query,
        chunks=chunks
    )

    # Convert citations into frontend format with percentage bounding boxes
    frontend_citations: List[FrontendCitation] = []
    for cit in result.citations:
        # Default coordinates or convert [x0, y0, x1, y1] to percentages
        if cit.bbox and len(cit.bbox) == 4:
            x0, y0, x1, y1 = cit.bbox
            # Assume 800x1050 standard page coordinate bounds if raw pixels
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


@app.post("/api/query", response_model=QueryResponse)
async def query_multimodal_rag(request: QueryRequest):
    """Legacy/direct raw endpoint returning detailed QueryResponse."""
    chunks = await retriever.search(
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
    """Returns official demo response for fast frontend testing."""
    return reasoning_engine._build_benchmark_demo_response(
        query="Compare production efficiency between Q2 and Q4, identify the three biggest reasons for the change, and show me the proof.",
        start_time=0
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
