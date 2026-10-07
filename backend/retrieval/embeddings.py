import logging
import numpy as np
from typing import List, Union

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL = None
_DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"
_DIMENSION = 384

class EmbeddingManager:
    """
    Local embedding manager using sentence-transformers (all-MiniLM-L6-v2 by default).
    Provides robust fallbacks to ensure retrieval works seamlessly in all environments.
    """

    def __init__(self, model_name: str = _DEFAULT_MODEL_NAME):
        self.model_name = model_name
        self.model = None
        self._init_model()

    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to load SentenceTransformer ({e}). Using lightweight hash fallback embedder.")
            self.model = None

    def embed_text(self, text: str) -> np.ndarray:
        """Embeds a single string into a 1D float32 normalized vector."""
        return self.embed_texts([text])[0]

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Embeds a list of strings into a 2D float32 normalized numpy array (N, dim)."""
        if not texts:
            return np.zeros((0, _DIMENSION), dtype=np.float32)

        if self.model is not None:
            try:
                embeddings = self.model.encode(
                    texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                return embeddings.astype(np.float32)
            except Exception as e:
                logger.error(f"Embedding generation error: {e}. Falling back to hash vectors.")

        # Hash vector fallback if sentence-transformers is missing/failed
        vecs = []
        for text in texts:
            vec = np.zeros(_DIMENSION, dtype=np.float32)
            for word in text.lower().split():
                idx = abs(hash(word)) % _DIMENSION
                vec[idx] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            vecs.append(vec)
        return np.array(vecs, dtype=np.float32)

def get_embedding_manager(model_name: str = _DEFAULT_MODEL_NAME) -> EmbeddingManager:
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None or _EMBEDDING_MODEL.model_name != model_name:
        _EMBEDDING_MODEL = EmbeddingManager(model_name)
    return _EMBEDDING_MODEL
