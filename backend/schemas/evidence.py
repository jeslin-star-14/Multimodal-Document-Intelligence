from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

EvidenceType = Literal["text", "table", "chart", "graph", "image", "ocr"]

class TableData(BaseModel):
    headers: List[str] = Field(default_factory=list, description="Table column header names")
    rows: List[List[str]] = Field(default_factory=list, description="Table row content cell values")

class Evidence(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence ID e.g., E001")
    document_id: str = Field(..., description="Unique document ID e.g., DOC001")
    document_name: str = Field(..., description="Original PDF file name")
    page: int = Field(..., description="1-indexed page number where evidence was extracted")
    section: Optional[str] = Field(None, description="Section heading if detected, otherwise null")
    type: EvidenceType = Field(..., description="Content type of the evidence")
    text: str = Field("", description="Extracted text or OCR output")
    table: Optional[TableData] = Field(None, description="Extracted table data if type is 'table'")
    image_path: str = Field(..., description="Relative filepath to rendered high-res page image PNG")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata e.g. bounding box, layout info")

class DocumentProcessResponse(BaseModel):
    success: bool = True
    document_id: str
    document_name: str
    page_count: int
    evidence_count: int
    evidence: List[Evidence] = Field(default_factory=list)
