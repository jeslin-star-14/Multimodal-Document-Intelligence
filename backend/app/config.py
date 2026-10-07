import os
from pathlib import Path
from dotenv import load_dotenv

# Determine base and root directories
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables from backend/.env or root .env
for env_path in [BASE_DIR / ".env", ROOT_DIR / ".env", Path.cwd() / ".env"]:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
load_dotenv()

DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CROPS_DIR = DATA_DIR / "crops"
PAGES_DIR = DATA_DIR / "pages"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CROPS_DIR.mkdir(parents=True, exist_ok=True)
PAGES_DIR.mkdir(parents=True, exist_ok=True)

# Google AI Studio / Gemini / Gemma API Key
GEMINI_API_KEY = (
    os.getenv("GEMINI_API_KEY") 
    or os.getenv("GOOGLE_API_KEY") 
    or os.getenv("GOOGLE_AI_STUDIO_API_KEY") 
    or os.getenv("GEMMA_API_KEY") 
    or ""
).strip()

VLM_MODEL = os.getenv("VLM_MODEL") or os.getenv("GEMMA_MODEL") or "gemini-2.0-flash"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEMO_MODE = os.getenv("DEMO_MODE", "false").strip().lower() in {"1", "true", "yes", "on"}

CORS_ORIGINS = [
    origin.strip() 
    for origin in os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
