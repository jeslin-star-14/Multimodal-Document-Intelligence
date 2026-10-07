import urllib.request
import json
import sys

BASE = "http://localhost:8000"

def test_endpoint(name, url, method="GET", data=None):
    try:
        payload = json.dumps(data).encode("utf-8") if data else None
        headers = {"Content-Type": "application/json"} if data else {}
        req = urllib.request.Request(url, data=payload, headers=headers)
        if method != "GET":
            req.method = method
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
            print(f"[PASS] {name} ({status})")
            return body
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return None

def main():
    print("=" * 60)
    print("         SYSTEM VERIFICATION & QA TEST SUITE")
    print("=" * 60)

    # 1. Health
    test_endpoint("Health Check", f"{BASE}/health")

    # 2. Document Listing
    docs_resp = test_endpoint("List Documents", f"{BASE}/api/documents")
    if docs_resp:
        docs = docs_resp.get("documents", [])
        print(f"       Found {len(docs)} documents:")
        for d in docs:
            print(f"       * {d['name']} ({d['id']}) - {d['page_count']} pages, {d['size']}")

    # 3. Document Chunks
    test_endpoint("Fetch Chunks for Q2", f"{BASE}/api/documents/DOC_E10500/chunks")
    test_endpoint("Fetch Chunks for Q4", f"{BASE}/api/documents/DOC_F3811D/chunks")

    # 4. Chat QA Query - Compare Q2 vs Q4
    chat_payload = {
        "query": "Compare the production efficiency between Q2 and Q4. What were the root causes of the drop in Q4?",
        "document_id": None
    }
    chat_resp = test_endpoint("Chat QA (Q2 vs Q4 Comparison)", f"{BASE}/api/chat/query", method="POST", data=chat_payload)
    if chat_resp:
        ans = chat_resp.get("answer", "")
        print("\n--- Model Response Preview ---")
        print(ans[:500] + ("..." if len(ans) > 500 else ""))
        print(f"Citations count: {len(chat_resp.get('citations', []))}")
        print(f"Confidence score: {chat_resp.get('confidence_score')}")
        if chat_resp.get("mathematical_verification"):
            print("Math verification verified:", chat_resp["mathematical_verification"].get("verified"))

    # 5. Counterfactual Simulator
    sim_payload = {
        "metric_name": "Production Efficiency",
        "baseline_value": 70.8,
        "target_value": 82.5,
        "scenario_description": "Reduce unplanned downtime from 18 days to 5 days and eliminate CNC bearing failures"
    }
    sim_resp = test_endpoint("Counterfactual Simulation", f"{BASE}/api/simulate/counterfactual", method="POST", data=sim_payload)
    if sim_resp:
        print(f"       Simulated Result: {sim_resp.get('simulated_value')}% (Delta: {sim_resp.get('projected_delta')}%)")

    # 6. Spatial Lasso Query
    lasso_payload = {
        "document_id": "DOC_F3811D",
        "page_number": 1,
        "bbox": [15.0, 40.0, 70.0, 30.0],
        "question": "What is the reason for the 18 days downtime shown in this section?"
    }
    lasso_resp = test_endpoint("Visual Spatial Lasso Query", f"{BASE}/api/query/lasso", method="POST", data=lasso_payload)
    if lasso_resp:
        print(f"       Lasso reasoning returned ({len(lasso_resp.get('reasoning', ''))} chars)")

    print("\n=" * 60)
    print("         ALL INTEGRATION TESTS COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
