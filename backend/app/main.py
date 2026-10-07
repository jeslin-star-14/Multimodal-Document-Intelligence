import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from PIL import Image, ImageDraw, ImageFont

from app.config import (
    CORS_ORIGINS, 
    UPLOAD_DIR, 
    CROPS_DIR, 
    PAGES_DIR, 
    BASE_DIR
)
from app.models import (
    QueryRequest, 
    QueryResponse, 
    DocumentChunk, 
    IngestStatus
)
from app.retriever import retriever
from app.reasoning import reasoning_engine

app = FastAPI(
    title="Multimodal Document Intelligence API",
    description="VLM-powered Multimodal RAG with Visual Proof, Mathematical Verification, and Pixel Citations",
    version="1.0.0"
)

# Enable CORS for Member 3 (Frontend React / Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hackathon dev mode - allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for visual evidence inspector
app.mount("/api/assets/crops", StaticFiles(directory=str(CROPS_DIR)), name="crops")
app.mount("/api/assets/pages", StaticFiles(directory=str(PAGES_DIR)), name="pages")

# Also mount demo assets directory
DEMO_DIR = BASE_DIR / "data" / "demo"
DEMO_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/assets/demo", StaticFiles(directory=str(DEMO_DIR)), name="demo")


def _generate_demo_visual_assets():
    """Generates synthetic high-resolution demo chart and page assets so frontend can immediately test."""
    chart_path = DEMO_DIR / "q2_efficiency_chart.png"
    table_path = DEMO_DIR / "q4_metrics_table.png"
    page_q2_path = DEMO_DIR / "q2_page_4.png"
    page_q4_path = DEMO_DIR / "q4_page_2.png"
    page_q4_p5 = DEMO_DIR / "q4_page_5.png"

    if not chart_path.exists():
        # Create visual bar chart
        img = Image.new("RGB", (700, 360), color="#1e1e2e")
        draw = ImageDraw.Draw(img)
        draw.rectangle([10, 10, 690, 350], outline="#45475a", width=2)
        draw.text((30, 25), "OPERATIONS KPI: MONTHLY EFFICIENCY (%)", fill="#cdd6f4")
        
        # Bars: Apr (75%), May (79%), Jun (82.5%)
        bars = [("April", 75, 120), ("May", 79, 320), ("June (Peak)", 82.5, 520)]
        for label, val, x in bars:
            height = int(val * 2.5)
            y0 = 300 - height
            draw.rectangle([x, y0, x + 80, 300], fill="#89b4fa", outline="#b4befe")
            draw.text((x + 10, y0 - 22), f"{val}%", fill="#a6e3a1")
            draw.text((x + 5, 310), label, fill="#a6adc8")
        img.save(chart_path)

    if not table_path.exists():
        # Create visual table
        img = Image.new("RGB", (700, 300), color="#181825")
        draw = ImageDraw.Draw(img)
        draw.rectangle([10, 10, 690, 290], outline="#585b70", width=2)
        draw.text((30, 20), "Q4 OPERATING EFFICIENCY MATRIX (DECEMBER AUDIT)", fill="#f38ba8")
        
        headers = ["Department", "Target (%)", "Actual (%)", "Variance"]
        for i, h in enumerate(headers):
            draw.text((35 + i * 160, 60), h, fill="#cdd6f4")
        draw.line([30, 85, 670, 85], fill="#6c7086", width=2)

        rows = [
            ("Machining", "85.0%", "83.1%", "-1.9%"),
            ("Assembly", "80.0%", "70.8%", "-9.2% (CRITICAL)"),
            ("Quality Assurance", "92.0%", "91.4%", "-0.6%"),
            ("Packaging", "88.0%", "87.5%", "-0.5%")
        ]
        for r_idx, row in enumerate(rows):
            y = 105 + r_idx * 40
            for c_idx, val in enumerate(row):
                color = "#f38ba8" if "CRITICAL" in val else "#bac2de"
                draw.text((35 + c_idx * 160, y), val, fill=color)
        img.save(table_path)

    # Full page placeholders
    for p_path, title in [
        (page_q2_path, "Operations_Q2_Report.pdf - Page 4 (Manufacturing KPI)"),
        (page_q4_path, "Operations_Q4_Report.pdf - Page 2 (Summary Matrix)"),
        (page_q4_p5, "Operations_Q4_Report.pdf - Page 5 (Root Cause Analysis)")
    ]:
        if not p_path.exists():
            img = Image.new("RGB", (800, 1050), color="#11111b")
            draw = ImageDraw.Draw(img)
            draw.rectangle([15, 15, 785, 1035], outline="#313244", width=2)
            draw.text((40, 40), title, fill="#cdd6f4")
            draw.rectangle([60, 150, 740, 500], outline="#f38ba8", width=3)
            draw.text((80, 170), "[EVIDENCE REGION - BOUNDING BOX]", fill="#f9e2af")
            img.save(p_path)

_generate_demo_visual_assets()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Multimodal Document Intelligence API",
        "version": "1.0.0"
    }


@app.post("/api/query", response_model=QueryResponse)
async def query_multimodal_rag(request: QueryRequest):
    """
    Main endpoint for answering complex questions across mixed documents.
    Retrieves multimodal chunks (text + chart/table image crops), runs VLM reasoning,
    and returns verified answer with math proof and pixel citations.
    """
    chunks = await retriever.search(
        query=request.query,
        doc_names=request.doc_names,
        top_k=request.top_k
    )
    response = await reasoning_engine.generate_multimodal_answer(
        query=request.query,
        chunks=chunks
    )
    return response


@app.get("/api/benchmark/demo", response_model=QueryResponse)
async def get_benchmark_demo():
    """
    Returns the official Hackathon benchmark demonstration:
    'Compare production efficiency between Q2 and Q4, identify 3 biggest reasons, show proof.'
    Used for instant UI integration and live demo backup.
    """
    return reasoning_engine._build_benchmark_demo_response(
        query="Compare production efficiency between Q2 and Q4, identify the three biggest reasons for the change, and show me the proof.",
        start_time=0
    )


@app.post("/api/documents/ingest_chunks")
async def ingest_document_chunks(chunks: List[DocumentChunk]):
    """
    Contract endpoint for Member 2 (Document Ingestion Lead).
    Receives parsed text, table, and chart chunks with image crop paths and bounding boxes.
    """
    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks provided.")
    await retriever.add_chunks(chunks)
    return {
        "status": "success",
        "chunks_indexed": len(chunks),
        "doc_name": chunks[0].doc_name if chunks else "unknown"
    }


@app.get("/api/documents")
async def list_indexed_documents():
    """Returns all currently indexed documents in SQLite."""
    import sqlite3
    from app.retriever import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT doc_name, chunk_type, COUNT(*) 
        FROM chunks 
        GROUP BY doc_name, chunk_type
    """)
    rows = cursor.fetchall()
    conn.close()

    summary = {}
    for doc_name, c_type, count in rows:
        if doc_name not in summary:
            summary[doc_name] = {"text": 0, "table": 0, "chart": 0, "figure": 0, "total": 0}
        summary[doc_name][c_type] = count
        summary[doc_name]["total"] += count

    return {"documents": summary}
