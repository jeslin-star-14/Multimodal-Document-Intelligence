import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CROPS_DIR = DATA_DIR / "crops"
PAGES_DIR = DATA_DIR / "pages"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CROPS_DIR.mkdir(parents=True, exist_ok=True)
PAGES_DIR.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
VLM_MODEL = os.getenv("VLM_MODEL", "gemini-2.5-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

CORS_ORIGINS = [
    origin.strip() 
    for origin in os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
