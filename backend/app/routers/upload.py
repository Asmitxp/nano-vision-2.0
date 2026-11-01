from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.routers.auth import get_current_user
from app.utils.file_storage import save_uploaded_file
from app.config import settings
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Image Upload"])

@router.post("")
def upload_microscopy_image(
    file: UploadFile = File(...),
    title: str = Form("New Nanoparticle Sample"),
    description: str = Form(""),
    image_type: str = Form("SEM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts SEM or TEM image (PNG, JPG, TIFF, BMP).
    Deeply validates magic bytes signatures and records in project database.
    """
    if image_type not in ["SEM", "TEM"]:
        image_type = "SEM"
        
    rel_path, abs_path, width, height = save_uploaded_file(file)
    
    project = Project(
        user_id=current_user.id,
        title=title,
        description=description,
        image_type=image_type,
        original_image=rel_path,
        image_width=width,
        image_height=height,
        status="uploaded",
        calibration_method="uncalibrated",
        calibration_factor=1.0,
        calibration_unit="px"
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return {
        "project_id": project.id,
        "title": project.title,
        "image_type": project.image_type,
        "original_image": f"/api/upload/file/{Path(rel_path).name}",
        "relative_path": rel_path,
        "width": width,
        "height": height,
        "status": project.status
    }

@router.get("/file/{filename}")
def serve_image_file(filename: str):
    """Serves uploaded or generated image files safely."""
    clean_name = Path(filename).name
    # Check uploads folder
    file_path = settings.UPLOAD_PATH / clean_name
    if not file_path.exists():
        # Check sample_images folder
        file_path = settings.SAMPLE_PATH / clean_name
        
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
        
    return FileResponse(file_path)

