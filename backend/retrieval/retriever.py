import re
import logging
from typing import Dict, Any, List, Optional

from retrieval.embeddings import get_embedding_manager
from retrieval.indexer import get_vector_index
from retrieval.metadata_filter import filter_evidence_list

logger = logging.getLogger(__name__)

def extract_numerical_tokens(text: str) -> List[str]:
    """
    Extracts numerical tokens, percentages, currencies, dates, and quarter codes from text.
    Examples: 71%, $4250, Q1, Q2, Q4, 2026, 84.5
    """
    if not text:
        return []
    # Match patterns like Q1-Q4, 71%, $400, ₹4.2, numbers, dates
    pattern = r'\b(?:q[1-4]|\d+(?:\.\d+)?%?|\$\d+(?:\.\d+)?|₹\d+(?:\.\d+)?|\d{4})\b'
    tokens = re.findall(pattern, text.lower())
    return tokens

def compute_keyword_and_numerical_score(query: str, search_text: str) -> float:
    """
    Computes keyword matching score with heavy boosting for exact numerical and entity token matches.
    """
    if not query or not search_text:
        return 0.0

    query_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 1]
    if not query_tokens:
        return 0.0

    search_text_lower = search_text.lower()
    
    # 1. Basic word match count
    matched_words = sum(1 for t in query_tokens if t in search_text_lower)
    word_ratio = matched_words / len(query_tokens)

    # 2. Numerical & Quarter token boost
    query_nums = extract_numerical_tokens(query)
    num_boost = 0.0
    if query_nums:
        search_nums = set(extract_numerical_tokens(search_text))
        matched_nums = sum(1 for num in query_nums if num in search_nums or num in search_text_lower)
        num_boost = (matched_nums / len(query_nums)) * 0.4  # strong numerical boost

    return (word_ratio * 0.6) + num_boost

def retrieve(
    question: str,
    top_k: int = 8,
    document_ids: Optional[List[str]] = None,
    types: Optional[List[str]] = None,
    index_dir: str = "data/index"
) -> List[Dict[str, Any]]:
    """
    Executes hybrid multimodal retrieval across indexed documents.
    
    Args:
        question: User query string
        top_k: Max number of top results to return (default: 8)
        document_ids: Optional list of document IDs to restrict search to
        types: Optional list of evidence types to restrict search to (e.g. ["table", "chart"])
        index_dir: Path to persistent index store
        
    Returns:
        List of evidence objects with relevance score attached:
        [{"evidence_id": "...", "document_id": "...", "score": 0.92, ...}]
    """
    index = get_vector_index(index_dir)
    if not index.evidence_store:
        index._load_from_disk()
    
    if not index.evidence_store:
        logger.warning("No indexed documents available for retrieval.")
        return []

    # 1. Filter candidates by document_ids and types
    all_candidates = list(index.evidence_store.values())
    filtered_candidates = filter_evidence_list(all_candidates, document_ids=document_ids, types=types)
    
    if not filtered_candidates:
        logger.info("No candidates match the specified document or type filter.")
        return []

    # 2. Get dense query vector
    embedder = get_embedding_manager()
    query_vec = embedder.embed_text(question)

    # 3. Dense vector search over all items
    raw_vector_results = index.search(query_vec, top_k=len(index.keys_list))
    vector_score_map = {}
    for ev_item, vec_score in raw_vector_results:
        key = f"{ev_item['document_id']}_{ev_item['evidence_id']}"
        vector_score_map[key] = vec_score

    # 4. Combine Dense + Sparse Hybrid Scoring for filtered candidates
    scored_results = []
    for item in filtered_candidates:
        key = f"{item['document_id']}_{item['evidence_id']}"
        vec_score = vector_score_map.get(key, 0.0)
        
        search_text = item.get("_search_text", "")
        kw_num_score = compute_keyword_and_numerical_score(question, search_text)

        # Hybrid weighting: 60% vector semantic + 40% keyword/numerical exact match
        hybrid_score = (0.6 * vec_score) + (0.4 * kw_num_score)
        
        # Format response evidence object
        result_obj = {
            "evidence_id": item["evidence_id"],
            "document_id": item["document_id"],
            "document_name": item["document_name"],
            "page": item["page"],
            "section": item.get("section"),
            "type": item["type"],
            "text": item.get("text", ""),
            "table": item.get("table"),
            "image_path": item["image_path"],
            "metadata": item.get("metadata", {}),
            "score": round(float(hybrid_score), 4)
        }
        scored_results.append(result_obj)

    # 5. Sort by score descending and pick top_k
    scored_results.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored_results[:top_k]

    logger.info(f"Hybrid retrieval returned {len(top_results)} results for query: '{question}'")
    return top_results
