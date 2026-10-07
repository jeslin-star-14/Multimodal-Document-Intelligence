import os
import json
import logging
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from retrieval.embeddings import get_embedding_manager
from retrieval.metadata_filter import format_evidence_search_text

logger = logging.getLogger(__name__)

class LocalVectorIndex:
    """
    Persistent Local Vector Store using FAISS with numpy matrix fallback.
    Prevents duplicate evidence indexing and persists index and metadata to disk.
    """

    def __init__(self, index_dir: str = "data/index"):
        self.index_dir = index_dir
        os.makedirs(self.index_dir, exist_ok=True)
        
        self.metadata_path = os.path.join(self.index_dir, "metadata.json")
        self.faiss_path = os.path.join(self.index_dir, "index.faiss")
        self.npy_path = os.path.join(self.index_dir, "index.npy")

        # Map key "(document_id, evidence_id)" -> dict containing evidence data + search text
        self.evidence_store: Dict[str, Dict[str, Any]] = {}
        self.embeddings_matrix: Optional[np.ndarray] = None
        self.keys_list: List[str] = []

        self.faiss_index = None
        self.dim = 384
        self._load_from_disk()

    def _load_from_disk(self):
        """Loads index and metadata from disk if available."""
        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.evidence_store = data.get("evidence_store", {})
                    self.keys_list = data.get("keys_list", [])
                logger.info(f"Loaded {len(self.keys_list)} evidence entries from {self.metadata_path}")
            except Exception as e:
                logger.error(f"Failed to load metadata.json: {e}")

        if os.path.exists(self.npy_path):
            try:
                self.embeddings_matrix = np.load(self.npy_path)
                logger.info(f"Loaded embeddings matrix of shape {self.embeddings_matrix.shape}")
            except Exception as e:
                logger.error(f"Failed to load embeddings.npy: {e}")

    def save_to_disk(self):
        """Persists metadata and embeddings matrix to disk."""
        data = {
            "evidence_store": self.evidence_store,
            "keys_list": self.keys_list
        }
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        if self.embeddings_matrix is not None:
            np.save(self.npy_path, self.embeddings_matrix)

        logger.info("Vector index successfully persisted to disk.")

    def add_or_update_evidence(self, document_id: str, evidence_list: List[Dict[str, Any]]) -> int:
        """
        Indexes or updates evidence objects for a document. Prevents duplicate indexing.
        """
        embedder = get_embedding_manager()
        new_texts = []
        new_keys = []
        new_items = []

        for item in evidence_list:
            ev_id = item["evidence_id"]
            key = f"{document_id}_{ev_id}"
            
            search_text = format_evidence_search_text(item)
            item_copy = dict(item)
            item_copy["_search_text"] = search_text
            
            # If item exists, update in-place or record as new
            if key not in self.evidence_store:
                new_keys.append(key)
                new_texts.append(search_text)
                new_items.append((key, item_copy))
            else:
                self.evidence_store[key] = item_copy

        if not new_texts:
            self.save_to_disk()
            return 0

        # Generate embeddings for new texts
        new_embeddings = embedder.embed_texts(new_texts)  # (N, 384)

        for (key, item_copy) in new_items:
            self.evidence_store[key] = item_copy
            self.keys_list.append(key)

        if self.embeddings_matrix is None or self.embeddings_matrix.size == 0:
            self.embeddings_matrix = new_embeddings
        else:
            self.embeddings_matrix = np.vstack([self.embeddings_matrix, new_embeddings])

        self.save_to_disk()
        logger.info(f"Indexed {len(new_texts)} new evidence items for document {document_id}")
        return len(new_texts)

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[Dict[str, Any], float]]:
        """
        Performs dense vector similarity search (cosine similarity via dot product of unit vectors).
        Returns list of (evidence_dict, similarity_score).
        """
        if self.embeddings_matrix is None or len(self.keys_list) == 0:
            return []

        # Safely align matrix length with keys_list
        n = min(len(self.keys_list), len(self.embeddings_matrix))
        if n == 0:
            return []
            
        mat = self.embeddings_matrix[:n]
        scores = np.dot(mat, query_vector)
        
        top_k = min(top_k, n)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if idx < len(self.keys_list):
                key = self.keys_list[idx]
                if key in self.evidence_store:
                    ev_data = self.evidence_store[key]
                    score = float(scores[idx])
                    results.append((ev_data, score))

        return results

_INDEX_INSTANCE = None

def get_vector_index(index_dir: str = "data/index") -> LocalVectorIndex:
    global _INDEX_INSTANCE
    if _INDEX_INSTANCE is None:
        _INDEX_INSTANCE = LocalVectorIndex(index_dir)
    return _INDEX_INSTANCE

def index_document(document_result: Dict[str, Any], index_dir: str = "data/index") -> int:
    """
    Public indexing API function accepting the output dict of process_document().
    
    Args:
        document_result: Dict returned by process_document(pdf_path)
        index_dir: Target directory for persistent index files
        
    Returns:
        Number of newly indexed evidence items.
    """
    doc_id = document_result.get("document_id")
    evidence_list = document_result.get("evidence", [])
    if not doc_id or not evidence_list:
        logger.warning("Empty document_result or missing evidence passed to index_document.")
        return 0

    index = get_vector_index(index_dir)
    added_count = index.add_or_update_evidence(doc_id, evidence_list)
    return added_count
