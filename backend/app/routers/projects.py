from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pathlib import Path
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.particle import Particle
from app.schemas.project import ProjectResponse, ProjectUpdate, DashboardStats
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/projects", tags=["Project Management"])

def format_project_response(p: Project) -> Dict[str, Any]:
    orig_url = f"/api/upload/file/{Path(p.original_image).name}" if p.original_image else ""
    proc_url = f"/api/upload/file/{Path(p.processed_image).name}" if p.processed_image else ""
    over_url = f"/api/upload/file/{Path(p.overlay_image).name}" if p.overlay_image else ""
    
    return {
        "id": p.id,
        "user_id": p.user_id,
        "title": p.title,
        "description": p.description,
        "image_type": p.image_type,
        "original_image": orig_url,
        "processed_image": proc_url,
        "overlay_image": over_url,
        "image_width": p.image_width,
        "image_height": p.image_height,
        "calibration_method": p.calibration_method or "uncalibrated",
        "calibration_factor": p.calibration_factor or 1.0,
        "calibration_unit": p.calibration_unit or "nm",
        "total_particles": p.total_particles or 0,
        "mean_diameter": p.mean_diameter,
        "median_diameter": p.median_diameter,
        "std_diameter": p.std_diameter,
        "min_diameter": p.min_diameter,
        "max_diameter": p.max_diameter,
        "p25_diameter": p.p25_diameter,
        "p75_diameter": p.p75_diameter,
        "cv_diameter": p.cv_diameter,
        "status": p.status,
        "created_at": p.created_at,
        "updated_at": p.updated_at
    }

@router.get("/dashboard-stats")
def get_dashboard_statistics(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    
    total_images = len(projects)
    total_particles = sum(p.total_particles for p in projects if p.total_particles)
    
    # Calculate global average diameter from valid particles
    all_means = [p.mean_diameter for p in projects if p.mean_diameter and p.mean_diameter > 0]
    avg_diameter = round(float(sum(all_means) / len(all_means)), 2) if all_means else 0.0
    
    recent_projects = [
        format_project_response(p) 
        for p in sorted(projects, key=lambda x: x.created_at, reverse=True)[:5]
    ]
    
    return {
        "total_images": total_images,
        "total_particles": total_particles,
        "avg_particle_diameter": avg_diameter,
        "recent_projects": recent_projects
    }

@router.get("", response_model=List[Dict[str, Any]])
def list_projects(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [format_project_response(p) for p in projects]

@router.get("/{project_id}")
def get_project_details(
    project_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    particles = db.query(Particle).filter(Particle.project_id == project.id).all()
    
    return {
        "project": format_project_response(project),
        "particles_count": len(particles)
    }

@router.put("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if data.title is not None:
        project.title = data.title
    if data.description is not None:
        project.description = data.description
    if data.image_type is not None:
        project.image_type = data.image_type
        
    db.commit()
    db.refresh(project)
    return format_project_response(project)

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Delete image files from disk if they exist in uploads
    for img_rel in [project.original_image, project.processed_image, project.overlay_image]:
        if img_rel:
            p = settings.BASE_DIR / img_rel
            if p.exists() and "uploads" in str(p):
                try:
                    p.unlink()
                except Exception:
                    pass
                    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/compare")
def compare_projects(
    payload: Dict[str, List[int]],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project_ids = payload.get("project_ids", [])
    if not project_ids:
        raise HTTPException(status_code=400, detail="No project IDs provided for comparison")
        
    projects = db.query(Project).filter(
        Project.id.in_(project_ids),
        Project.user_id == current_user.id
    ).all()
    
    comparisons = []
    for p in projects:
        comparisons.append({
            "id": p.id,
            "title": p.title,
            "image_type": p.image_type,
            "unit": p.calibration_unit,
            "calibration_factor": p.calibration_factor,
            "total_particles": p.total_particles,
            "mean_diameter": p.mean_diameter,
            "median_diameter": p.median_diameter,
            "std_diameter": p.std_diameter,
            "min_diameter": p.min_diameter,
            "max_diameter": p.max_diameter,
            "cv_percent": p.cv_diameter
        })
        
    return {"samples": comparisons}

