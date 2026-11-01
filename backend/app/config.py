import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# On Vercel serverless, filesystem is read-only except /tmp
IS_VERCEL = bool(os.getenv("VERCEL"))
if IS_VERCEL:
    UPLOAD_DIR = Path("/tmp/uploads")
    SAMPLE_DIR = Path("/tmp/sample_images")
else:
    UPLOAD_DIR = BASE_DIR / "uploads"
    SAMPLE_DIR = BASE_DIR / "sample_images"

# Ensure directories exist safely
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

try:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

class Settings:
    PROJECT_NAME: str = "NanoVision AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nanovision-ultra-secure-scientific-jwt-key-2026-v1")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: SQLite default for seamless local running, postgresql:// fully compatible
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:////tmp/nanovision.db" if IS_VERCEL else f"sqlite:///{BASE_DIR / 'nanovision.db'}"
    )
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    UPLOAD_PATH: Path = UPLOAD_DIR
    SAMPLE_PATH: Path = SAMPLE_DIR
    
    # AI / LLM Integration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # File limits
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}

settings = Settings()
