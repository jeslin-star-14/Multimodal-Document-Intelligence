from app.models.schemas import *
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Alias / Extension models for reasoning and retrieval engine
class IngestStatus(BaseModel):
    doc_name: str
    total_pages: int
    text_chunks: int
    tables_found: int
    charts_found: int
    status: str
    message: str
