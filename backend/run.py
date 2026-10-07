import sys
import os
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn
from app.config import HOST, PORT

if __name__ == "__main__":
    print(f"🚀 Starting Multimodal Document Intelligence Backend on http://{HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

