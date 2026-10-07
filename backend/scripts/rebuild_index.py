import os
import sys
import glob
import json
import numpy as np
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from retrieval.embeddings import get_embedding_manager
from retrieval.metadata_filter import format_evidence_search_text

def rebuild():
    processed_dir = BACKEND_DIR / "data" / "processed"
    index_dir = BACKEND_DIR / "data" / "index"
    pages_dir = BACKEND_DIR / "data" / "pages"
    index_dir.mkdir(parents=True, exist_ok=True)

    evidence_store = {}
    keys_list = []
    search_texts = []

    for pf in sorted(processed_dir.glob("*.json")):
        try:
            with open(pf, "r", encoding="utf-8") as f:
                p_data = json.load(f)
            doc_id = p_data.get("document_id")
            doc_name = p_data.get("document_name", f"{doc_id}.pdf")
            if not doc_id:
                continue

            for ev in p_data.get("evidence", []):
                ev_id = ev.get("evidence_id")
                key = f"{doc_id}_{ev_id}"
                
                # Normalize image_path to POSIX format for the current environment
                page_num = ev.get("page", 1)
                expected_page_img = pages_dir / doc_id / f"page_{page_num}.png"
                if expected_page_img.exists():
                    ev["image_path"] = str(expected_page_img)
                elif ev.get("image_path"):
                    ev["image_path"] = ev["image_path"].replace("\\", "/")

                ev["document_id"] = doc_id
                ev["document_name"] = doc_name
                search_text = format_evidence_search_text(ev)
                
                item_copy = dict(ev)
                item_copy["_search_text"] = search_text
                
                evidence_store[key] = item_copy
                keys_list.append(key)
                search_texts.append(search_text)
        except Exception as e:
            print(f"Error processing {pf}: {e}")

    print(f"Found {len(keys_list)} evidence entries across processed documents.")

    embedder = get_embedding_manager()
    embeddings_matrix = embedder.embed_texts(search_texts)

    metadata_path = index_dir / "metadata.json"
    npy_path = index_dir / "index.npy"

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump({"evidence_store": evidence_store, "keys_list": keys_list}, f, indent=2, ensure_ascii=False)

    np.save(str(npy_path), embeddings_matrix)
    print(f"Successfully rebuilt vector index at {index_dir}: metadata.json ({len(keys_list)} keys) and index.npy shape {embeddings_matrix.shape}")

if __name__ == "__main__":
    rebuild()
