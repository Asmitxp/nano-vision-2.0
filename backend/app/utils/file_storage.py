import os
import uuid
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image
from fastapi import UploadFile, HTTPException
from app.config import settings

# Recognized magic bytes for image formats
MAGIC_NUMBERS = {
    b"\x89PNG\r\n\x1a\n": "png",
    b"\xff\xd8\xff": "jpeg",
    b"II*\x00": "tiff", # Little-endian TIFF
    b"MM\x00*": "tiff", # Big-endian TIFF
    b"BM": "bmp",
}

def validate_image_bytes(file_bytes: bytes) -> str:
    """Verifies actual image content signatures rather than trusting file extensions."""
    for magic, fmt in MAGIC_NUMBERS.items():
        if file_bytes.startswith(magic):
            return fmt
    # Fallback to PIL format check
    try:
        from io import BytesIO
        img = Image.open(BytesIO(file_bytes))
        img.verify()
        return img.format.lower() if img.format else "unknown"
    except Exception:
        raise HTTPException(
            status_code=400, 
            detail="Invalid image format. Supported formats: PNG, JPG, JPEG, TIFF, BMP."
        )

def save_uploaded_file(file: UploadFile) -> Tuple[str, Path, int, int]:
    """Saves uploaded file securely and returns relative path, absolute path, width, height."""
    original_ext = Path(file.filename or "image.png").suffix.lower()
    if original_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{original_ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    content = file.file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
    
    # Deep content verification
    detected_format = validate_image_bytes(content)
    
    unique_name = f"{uuid.uuid4().hex}{original_ext}"
    dest_path = settings.UPLOAD_PATH / unique_name
    
    with open(dest_path, "wb") as f:
        f.write(content)
        
    try:
        with Image.open(dest_path) as img:
            width, height = img.size
    except Exception:
        # If Pillow fails on tiff variants, fallback
        import cv2
        cv_img = cv2.imread(str(dest_path))
        if cv_img is not None:
            height, width = cv_img.shape[:2]
        else:
            width, height = 0, 0

    relative_path = f"uploads/{unique_name}"
    return relative_path, dest_path, width, height

