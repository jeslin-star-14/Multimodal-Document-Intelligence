import asyncio
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models import QueryRequest
from app.retriever import retriever
from app.reasoning import reasoning_engine

async def main():
    print("=" * 70)
    print("[TEST] MULTIMODAL DOCUMENT INTELLIGENCE: SYSTEM TEST")
    print("=" * 70)

    query = (
        "Compare production efficiency between Q2 and Q4, "
        "identify the three biggest reasons for the change, and show me the proof."
    )
    print(f"\n[QUERY]:\n{query}\n")

    chunks = await retriever.search(query=query, top_k=5)
    print(f"Retrieved Chunks Count: {len(chunks)}")

    response = await reasoning_engine.generate_multimodal_answer(query=query, chunks=chunks)

    print("\n" + "=" * 70)
    print("[MODEL ANSWER] (WITH STRICT INLINE CITATIONS):")
    print("=" * 70)
    print(response.answer)

    print("\n" + "=" * 70)
    print("[MATHEMATICAL VERIFICATION STEPS]:")
    print("=" * 70)
    for step in response.math_steps:
        print(f"  * {step}")

    print("\n" + "=" * 70)
    print("[VISUAL CITATIONS & EVIDENCE (PROOF)]:")
    print("=" * 70)
    for cit in response.citations:
        print(f"  [{cit.citation_id}] {cit.title}")
        print(f"      - Doc: {cit.doc_name}, Page: {cit.page_number}, Section: {cit.section}")
        print(f"      - Type: {cit.type.upper()}, Confidence: {cit.confidence * 100}%")
        print(f"      - Visual Crop URL: {cit.crop_url}")
        print(f"      - Full Page Preview URL: {cit.page_url}")
        print(f"      - Bounding Box: {cit.bbox}\n")

    print(f"Processing Time: {response.processing_time_ms} ms")
    print("=" * 70)
    print("[SUCCESS] TEST COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
