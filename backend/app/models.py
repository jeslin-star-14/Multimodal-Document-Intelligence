from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float

class DocumentChunk(BaseModel):
    chunk_id: str
    doc_name: str
    page_number: int
    chunk_type: Literal["text", "table", "chart", "figure"] = "text"
    content: str = Field(..., description="Text content, table markdown, or chart visual summary")
    bbox: Optional[List[float]] = Field(default=None, description="[x0, y0, x1, y1] bounding box")
    crop_path: Optional[str] = Field(default=None, description="Local or relative path to high-res crop")
    page_image_path: Optional[str] = Field(default=None, description="Path to rendered full page image")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None

class Citation(BaseModel):
    citation_id: int
    doc_name: str
    page_number: int
    section: Optional[str] = "General"
    type: Literal["text", "table", "chart", "figure"] = "text"
    title: str
    crop_url: Optional[str] = None
    page_url: Optional[str] = None
    bbox: Optional[List[float]] = None
    confidence: float = 0.95
    snippet: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    doc_names: Optional[List[str]] = None
    top_k: int = 6

class QueryResponse(BaseModel):
    query: str
    answer: str
    confidence_score: float = 0.95
    math_steps: List[str] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)
    evidence: List[Citation] = Field(default_factory=list)
    processing_time_ms: float = 0.0

class IngestStatus(BaseModel):
    doc_name: str
    total_pages: int
    text_chunks: int
    tables_found: int
    charts_found: int
    status: str
    message: str
