from typing import List, Optional, Literal
from pydantic import BaseModel, Field

ChunkType = Literal['text', 'table', 'image', 'chart']
DocumentStatus = Literal['Uploading', 'Parsing', 'OCR', 'Embedding', 'Ready', 'Error']

class BoundingBox(BaseModel):
    id: str
    x: float = Field(..., description="X coordinate percentage (0-100)")
    y: float = Field(..., description="Y coordinate percentage (0-100)")
    width: float = Field(..., description="Width percentage (0-100)")
    height: float = Field(..., description="Height percentage (0-100)")
    label: Optional[str] = None
    type: ChunkType
    color: Optional[str] = "#6366f1"

class TableData(BaseModel):
    headers: List[str]
    rows: List[List[str]]

class DocumentChunk(BaseModel):
    id: str
    document_id: str
    document_name: str
    page_number: int
    type: ChunkType
    content: str
    raw_table_data: Optional[TableData] = None
    image_url: Optional[str] = None
    similarity_score: float = 0.0
    bounding_box: Optional[BoundingBox] = None

class Entity(BaseModel):
    category: Literal['Org', 'Date', 'Financial', 'Metric', 'Location', 'Person']
    value: str

class DocumentInsights(BaseModel):
    summary: str
    key_entities: List[Entity]
    suggested_questions: List[str]

class DocumentMetadata(BaseModel):
    id: str
    name: str
    size: str
    type: Literal['pdf', 'docx', 'pptx', 'image']
    page_count: int
    uploaded_at: str
    status: DocumentStatus
    progress: int = 100
    insights: Optional[DocumentInsights] = None
    page_images: Optional[List[str]] = None

class Citation(BaseModel):
    id: str
    document_id: str
    document_name: str
    page_number: int
    chunk_type: ChunkType
    label: str
    chunk_id: str
    similarity_score: float
    bounding_box: Optional[BoundingBox] = None

class QueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    language: Optional[str] = "en"

class QueryResponse(BaseModel):
    text: str
    confidence_score: int
    citations: List[Citation]
    not_found: bool = False
