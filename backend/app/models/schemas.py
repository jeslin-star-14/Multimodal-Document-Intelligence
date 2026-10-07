from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

ChunkType = Literal['text', 'table', 'image', 'chart']
DocumentStatus = Literal['Uploading', 'Parsing', 'OCR', 'Embedding', 'Ready', 'Error']

class BoundingBox(BaseModel):
    id: str = "bbox-1"
    x: float = Field(0.0, description="X coordinate percentage (0-100)")
    y: float = Field(0.0, description="Y coordinate percentage (0-100)")
    width: float = Field(100.0, description="Width percentage (0-100)")
    height: float = Field(100.0, description="Height percentage (0-100)")
    label: Optional[str] = None
    type: ChunkType = "text"
    color: Optional[str] = "#6366f1"
    # Pixel coordinates compatibility
    x0: Optional[float] = None
    y0: Optional[float] = None
    x1: Optional[float] = None
    y1: Optional[float] = None

class TableData(BaseModel):
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)

class DocumentChunk(BaseModel):
    id: str = ""
    document_id: str = ""
    document_name: str = ""
    page_number: int = 1
    type: ChunkType = "text"
    content: str = ""
    raw_table_data: Optional[TableData] = None
    image_url: Optional[str] = None
    similarity_score: float = 0.0
    bounding_box: Optional[BoundingBox] = None
    
    # Compatibility fields for backend retriever & reasoning:
    chunk_id: Optional[str] = None
    doc_name: Optional[str] = None
    chunk_type: Optional[str] = None
    bbox: Optional[List[float]] = None
    crop_path: Optional[str] = None
    page_image_path: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.chunk_id and self.id:
            self.chunk_id = self.id
        elif not self.id and self.chunk_id:
            self.id = self.chunk_id
            
        if not self.doc_name and self.document_name:
            self.doc_name = self.document_name
        elif not self.document_name and self.doc_name:
            self.document_name = self.doc_name
            
        if not self.chunk_type and self.type:
            self.chunk_type = self.type
        elif not self.type and self.chunk_type:
            c_type = self.chunk_type if self.chunk_type in ['text', 'table', 'image', 'chart'] else 'image'
            self.type = c_type

class Entity(BaseModel):
    category: Literal['Org', 'Date', 'Financial', 'Metric', 'Location', 'Person']
    value: str

class DocumentInsights(BaseModel):
    summary: str
    key_entities: List[Entity] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)

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
    id: str = ""
    document_id: str = ""
    document_name: str = ""
    page_number: int = 1
    chunk_type: ChunkType = "text"
    label: str = ""
    chunk_id: str = ""
    similarity_score: float = 0.95
    bounding_box: Optional[BoundingBox] = None
    
    # Compatibility fields:
    citation_id: Optional[int] = None
    doc_name: Optional[str] = None
    section: Optional[str] = None
    type: Optional[str] = None
    title: Optional[str] = None
    crop_url: Optional[str] = None
    page_url: Optional[str] = None
    bbox: Optional[List[float]] = None
    confidence: Optional[float] = None
    snippet: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.doc_name and self.document_name:
            self.doc_name = self.document_name
        elif not self.document_name and self.doc_name:
            self.document_name = self.doc_name
            
        if not self.type and self.chunk_type:
            self.type = self.chunk_type
        elif not self.chunk_type and self.type:
            c_type = self.type if self.type in ['text', 'table', 'image', 'chart'] else 'image'
            self.chunk_type = c_type
            
        if not self.confidence and self.similarity_score:
            self.confidence = self.similarity_score
        elif not self.similarity_score and self.confidence:
            self.similarity_score = self.confidence

class QueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    language: Optional[str] = "en"
    doc_names: Optional[List[str]] = None
    top_k: int = 5

class QueryResponse(BaseModel):
    text: str = ""
    confidence_score: float = 95.0
    citations: List[Citation] = Field(default_factory=list)
    not_found: bool = False
    
    # Compatibility fields:
    query: Optional[str] = None
    answer: Optional[str] = None
    math_steps: List[str] = Field(default_factory=list)
    evidence: List[Citation] = Field(default_factory=list)
    processing_time_ms: float = 0.0

    def model_post_init(self, __context: Any) -> None:
        if self.confidence_score <= 1.0:
            self.confidence_score = round(self.confidence_score * 100, 1)
        if not self.answer and self.text:
            self.answer = self.text
        elif not self.text and self.answer:
            self.text = self.answer
        if not self.evidence and self.citations:
            self.evidence = self.citations
