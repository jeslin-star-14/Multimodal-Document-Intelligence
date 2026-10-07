import json
import sqlite3
import numpy as np
import httpx
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.config import DATA_DIR, GEMINI_API_KEY, EMBEDDING_MODEL
from app.models import DocumentChunk

DB_PATH = DATA_DIR / "multimodal_rag.db"

class HybridRetriever:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                chunk_id TEXT PRIMARY KEY,
                doc_name TEXT,
                page_number INTEGER,
                chunk_type TEXT,
                content TEXT,
                bbox TEXT,
                crop_path TEXT,
                page_image_path TEXT,
                metadata TEXT,
                embedding TEXT
            )
        """)
        conn.commit()
        conn.close()

    async def get_embedding(self, text: str) -> List[float]:
        """Fetch embedding from Gemini text-embedding-004 or generate deterministic normalized pseudo-vector fallback."""
        if not text.strip():
            return [0.0] * 768
            
        if GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBEDDING_MODEL}:embedContent?key={GEMINI_API_KEY}"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json={"content": {"parts": [{"text": text[:2000]}]}}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        return data.get("embedding", {}).get("values", [])
            except Exception as e:
                print(f"[Retriever] Gemini embedding API error, falling back to local: {e}")

        # Deterministic lightweight hashed embedding fallback for offline / mock testing
        np.random.seed(abs(hash(text)) % (2**32))
        vec = np.random.randn(768).astype(float)
        norm = np.linalg.norm(vec)
        return (vec / (norm if norm > 0 else 1.0)).tolist()

    async def add_chunks(self, chunks: List[DocumentChunk]):
        """Indexes document chunks into SQLite with embeddings."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        for chunk in chunks:
            if not chunk.embedding:
                chunk.embedding = await self.get_embedding(chunk.content)

            cursor.execute("""
                INSERT OR REPLACE INTO chunks 
                (chunk_id, doc_name, page_number, chunk_type, content, bbox, crop_path, page_image_path, metadata, embedding)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                chunk.chunk_id,
                chunk.doc_name,
                chunk.page_number,
                chunk.chunk_type,
                chunk.content,
                json.dumps(chunk.bbox) if chunk.bbox else None,
                chunk.crop_path,
                chunk.page_image_path,
                json.dumps(chunk.metadata),
                json.dumps(chunk.embedding) if chunk.embedding else None
            ))

        conn.commit()
        conn.close()

    def _bm25_score(self, query_tokens: List[str], text: str) -> float:
        text_lower = text.lower()
        score = 0.0
        for token in query_tokens:
            if token in text_lower:
                score += 1.0 + (text_lower.count(token) * 0.2)
        return score

    async def search(
        self, 
        query: str, 
        doc_names: Optional[List[str]] = None, 
        top_k: int = 5
    ) -> List[DocumentChunk]:
        """Hybrid Search combining dense cosine similarity and BM25 token matching with RRF."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if doc_names:
            placeholders = ",".join("?" for _ in doc_names)
            cursor.execute(f"SELECT * FROM chunks WHERE doc_name IN ({placeholders})", doc_names)
        else:
            cursor.execute("SELECT * FROM chunks")

        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        query_emb = await self.get_embedding(query)
        query_vec = np.array(query_emb, dtype=float)
        query_norm = np.linalg.norm(query_vec)
        query_tokens = [w.lower() for w in query.split() if len(w) > 2]

        dense_scores = []
        bm25_scores = []
        parsed_chunks = []

        for row in rows:
            (chunk_id, doc_name, page_number, chunk_type, content, 
             bbox_json, crop_path, page_image_path, metadata_json, emb_json) = row

            chunk = DocumentChunk(
                chunk_id=chunk_id,
                doc_name=doc_name,
                page_number=page_number,
                chunk_type=chunk_type,
                content=content,
                bbox=json.loads(bbox_json) if bbox_json else None,
                crop_path=crop_path,
                page_image_path=page_image_path,
                metadata=json.loads(metadata_json) if metadata_json else {}
            )
            parsed_chunks.append(chunk)

            # Dense similarity
            if emb_json and query_norm > 0:
                doc_vec = np.array(json.loads(emb_json), dtype=float)
                doc_norm = np.linalg.norm(doc_vec)
                cos_sim = float(np.dot(query_vec, doc_vec) / (query_norm * doc_norm)) if doc_norm > 0 else 0.0
            else:
                cos_sim = 0.0
            dense_scores.append(cos_sim)

            # BM25 Lexical
            bm25_val = self._bm25_score(query_tokens, content)
            bm25_scores.append(bm25_val)

        # Reciprocal Rank Fusion (RRF)
        dense_rank = np.argsort(dense_scores)[::-1]
        bm25_rank = np.argsort(bm25_scores)[::-1]

        k = 60
        rrf_scores = np.zeros(len(rows))

        for rank, idx in enumerate(dense_rank):
            rrf_scores[idx] += 1.0 / (k + rank + 1)
        for rank, idx in enumerate(bm25_rank):
            rrf_scores[idx] += 1.0 / (k + rank + 1)

        # Top K selection
        top_indices = np.argsort(rrf_scores)[::-1][:top_k]
        return [parsed_chunks[i] for i in top_indices]

retriever = HybridRetriever()
