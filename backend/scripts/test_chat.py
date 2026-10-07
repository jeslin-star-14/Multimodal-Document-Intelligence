import urllib.request
import json

payload = {
    "query": "Compare the production efficiency between Q2 and Q4. What were the root causes of the drop in Q4?",
    "document_id": None
}

req = urllib.request.Request(
    "http://localhost:8000/api/chat/query",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    print("STATUS:", resp.status)
    print("CITATIONS COUNT:", len(data.get("citations", [])))
    for c in data.get("citations", []):
        print(f"  - {c.get('document_name')} (Page {c.get('page_number')}) [{c.get('chunk_type')}]")
    print("\nANSWER:\n" + data.get("text", ""))
