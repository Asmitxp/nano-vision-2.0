import json
import uuid
import math
import cv2
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.particle import Particle
from app.routers.auth import get_current_user
from app.schemas.analysis import (
    CalibrationRequest, CalibrationResponse, DetectionSettings, 
    ParticleToggleRequest, AnalysisResponse, ParticleResponse
)
from app.services.cv_pipeline import ComputerVisionPipeline
from app.services.measurements import compute_physical_measurements
from app.services.statistics import calculate_particle_statistics
from app.config import settings

router = APIRouter(prefix="/analysis", tags=["Nanoparticle Analysis"])

@router.post("/calibrate/{project_id}", response_model=CalibrationResponse)
def calibrate_scale(
    project_id: int,
    calibration_data: CalibrationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pixel_distance = 0.0
    if calibration_data.method == "manual":
        if not calibration_data.point1 or not calibration_data.point2:
            raise HTTPException(status_code=400, detail="Two calibration points [x, y] are required for manual calibration")
        p1 = calibration_data.point1
        p2 = calibration_data.point2
        pixel_distance = math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)
    elif calibration_data.method == "scale_bar":
        if calibration_data.scale_bar_bbox and len(calibration_data.scale_bar_bbox) == 4:
            # width of scale bar box
            pixel_distance = float(calibration_data.scale_bar_bbox[2])
        else:
            raise HTTPException(status_code=400, detail="Scale bar bounding box [x, y, w, h] required")
    else:
        raise HTTPException(status_code=400, detail="Invalid calibration method")

    if pixel_distance <= 0:
        raise HTTPException(status_code=400, detail="Pixel distance must be greater than zero")

    known_dist = float(calibration_data.known_distance)
    calibration_factor = known_dist / pixel_distance # physical units per pixel
    pixels_per_unit = pixel_distance / known_dist

    project.calibration_method = calibration_data.method
    project.calibration_factor = round(calibration_factor, 6)
    project.calibration_unit = calibration_data.unit
    project.status = "calibrated"

    # If particles were already analyzed, update their physical metrics in-place!
    existing_particles = db.query(Particle).filter(Particle.project_id == project.id).all()
    if existing_particles:
        factor_sq = project.calibration_factor ** 2
        for p in existing_particles:
            p.area_physical = round(p.area_px * factor_sq, 3)
            p.perimeter_physical = round(p.perimeter_px * project.calibration_factor, 3)
            p.ecd_physical = round(p.ecd_px * project.calibration_factor, 3)
            p.major_axis_physical = round(p.major_axis_px * project.calibration_factor, 3)
            p.minor_axis_physical = round(p.minor_axis_px * project.calibration_factor, 3)
            p.feret_physical = round((p.feret_px or p.major_axis_px) * project.calibration_factor, 3)

        # Recalculate project summary statistics
        p_dicts = [{
            "ecd_physical": p.ecd_physical,
            "aspect_ratio": p.aspect_ratio,
            "circularity": p.circularity,
            "is_valid": p.is_valid,
            "is_uncertain": p.is_uncertain
        } for p in existing_particles]
        
        stats = calculate_particle_statistics(p_dicts, unit=project.calibration_unit)
        project.mean_diameter = stats["mean_diameter"]
        project.median_diameter = stats["median_diameter"]
        project.std_diameter = stats["std_diameter"]
        project.min_diameter = stats["min_diameter"]
        project.max_diameter = stats["max_diameter"]
        project.p25_diameter = stats["p25_diameter"]
        project.p75_diameter = stats["p75_diameter"]
        project.cv_diameter = stats["cv_percent"]

    db.commit()
    db.refresh(project)

    return CalibrationResponse(
        pixel_distance=round(pixel_distance, 2),
        known_distance=known_dist,
        unit=project.calibration_unit,
        calibration_factor=project.calibration_factor,
        pixels_per_unit=round(pixels_per_unit, 4),
        message=f"Scale calibrated: 1 pixel = {project.calibration_factor:.4f} {project.calibration_unit} ({pixels_per_unit:.2f} px/{project.calibration_unit})"
    )

@router.post("/run/{project_id}")
def run_nanoparticle_detection(
    project_id: int,
    detection_settings: DetectionSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    image_path = settings.BASE_DIR / project.original_image
    if not image_path.exists():
        raise HTTPException(status_code=400, detail="Original image not found on disk")

    # Run Computer Vision Pipeline
    pipeline = ComputerVisionPipeline(detection_settings.model_dump())
    orig_bgr, proc_bgr, over_bgr, raw_particles = pipeline.process_image(image_path)

    # Save processed and overlay images
    proc_filename = f"proc_{uuid.uuid4().hex[:10]}.png"
    over_filename = f"over_{uuid.uuid4().hex[:10]}.png"
    
    cv2.imwrite(str(settings.UPLOAD_PATH / proc_filename), proc_bgr)
    cv2.imwrite(str(settings.UPLOAD_PATH / over_filename), over_bgr)

    project.processed_image = f"uploads/{proc_filename}"
    project.overlay_image = f"uploads/{over_filename}"
    project.detection_settings = json.dumps(detection_settings.model_dump())

    # Clear prior particles
    db.query(Particle).filter(Particle.project_id == project.id).delete()

    # Apply physical calibration to all particles
    factor = project.calibration_factor if project.calibration_factor and project.calibration_factor > 0 else 1.0
    db_particles = []
    particle_dicts_for_stats = []

    for r_part in raw_particles:
        phys_part = compute_physical_measurements(r_part, factor)
        p_obj = Particle(
            project_id=project.id,
            particle_number=phys_part["particle_number"],
            center_x=phys_part["center_x"],
            center_y=phys_part["center_y"],
            bbox_x=phys_part["bbox_x"],
            bbox_y=phys_part["bbox_y"],
            bbox_w=phys_part["bbox_w"],
            bbox_h=phys_part["bbox_h"],
            area_px=phys_part["area_px"],
            perimeter_px=phys_part["perimeter_px"],
            ecd_px=phys_part["ecd_px"],
            major_axis_px=phys_part["major_axis_px"],
            minor_axis_px=phys_part["minor_axis_px"],
            feret_px=phys_part["feret_px"],
            area_physical=phys_part["area_physical"],
            perimeter_physical=phys_part["perimeter_physical"],
            ecd_physical=phys_part["ecd_physical"],
            major_axis_physical=phys_part["major_axis_physical"],
            minor_axis_physical=phys_part["minor_axis_physical"],
            feret_physical=phys_part["feret_physical"],
            aspect_ratio=phys_part["aspect_ratio"],
            circularity=phys_part["circularity"],
            is_valid=phys_part["is_valid"],
            is_uncertain=phys_part["is_uncertain"],
            contour_points=phys_part["contour_points"]
        )
        db_particles.append(p_obj)
        particle_dicts_for_stats.append(phys_part)

    db.add_all(db_particles)

    # Compute Statistics
    stats = calculate_particle_statistics(particle_dicts_for_stats, unit=project.calibration_unit)
    
    project.total_particles = len(db_particles)
    project.mean_diameter = stats["mean_diameter"]
    project.median_diameter = stats["median_diameter"]
    project.std_diameter = stats["std_diameter"]
    project.min_diameter = stats["min_diameter"]
    project.max_diameter = stats["max_diameter"]
    project.p25_diameter = stats["p25_diameter"]
    project.p75_diameter = stats["p75_diameter"]
    project.cv_diameter = stats["cv_percent"]
    project.status = "analyzed"

    db.commit()
    db.refresh(project)

    # Fetch stored particles for response
    all_particles = db.query(Particle).filter(Particle.project_id == project.id).all()

    return {
        "project_id": project.id,
        "status": project.status,
        "original_image": f"/api/upload/file/{Path(project.original_image).name}",
        "processed_image": f"/api/upload/file/{Path(project.processed_image).name}",
        "overlay_image": f"/api/upload/file/{Path(project.overlay_image).name}",
        "calibration_factor": project.calibration_factor,
        "calibration_unit": project.calibration_unit,
        "statistics": stats,
        "particles": [ParticleResponse.model_validate(p) for p in all_particles]
    }

@router.post("/toggle-particle/{project_id}")
def toggle_particle_validity(
    project_id: int,
    payload: ParticleToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    particle = db.query(Particle).filter(
        Particle.id == payload.particle_id,
        Particle.project_id == project.id
    ).first()
    if not particle:
        raise HTTPException(status_code=404, detail="Particle not found")

    particle.is_valid = payload.is_valid
    db.commit()

    # Re-calculate statistics dynamically
    all_particles = db.query(Particle).filter(Particle.project_id == project.id).all()
    p_dicts = [{
        "ecd_physical": p.ecd_physical,
        "aspect_ratio": p.aspect_ratio,
        "circularity": p.circularity,
        "is_valid": p.is_valid,
        "is_uncertain": p.is_uncertain
    } for p in all_particles]

    stats = calculate_particle_statistics(p_dicts, unit=project.calibration_unit)
    project.mean_diameter = stats["mean_diameter"]
    project.median_diameter = stats["median_diameter"]
    project.std_diameter = stats["std_diameter"]
    project.min_diameter = stats["min_diameter"]
    project.max_diameter = stats["max_diameter"]
    project.p25_diameter = stats["p25_diameter"]
    project.p75_diameter = stats["p75_diameter"]
    project.cv_diameter = stats["cv_percent"]
    db.commit()

    return {
        "particle_id": particle.id,
        "is_valid": particle.is_valid,
        "updated_statistics": stats
    }

@router.get("/results/{project_id}")
def get_analysis_results(
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
    p_dicts = [{
        "ecd_physical": p.ecd_physical,
        "aspect_ratio": p.aspect_ratio,
        "circularity": p.circularity,
        "is_valid": p.is_valid,
        "is_uncertain": p.is_uncertain
    } for p in particles]

    stats = calculate_particle_statistics(p_dicts, unit=project.calibration_unit)

    orig_url = f"/api/upload/file/{Path(project.original_image).name}" if project.original_image else ""
    proc_url = f"/api/upload/file/{Path(project.processed_image).name}" if project.processed_image else ""
    over_url = f"/api/upload/file/{Path(project.overlay_image).name}" if project.overlay_image else ""

    return {
        "project_id": project.id,
        "status": project.status,
        "title": project.title,
        "image_type": project.image_type,
        "original_image": orig_url,
        "processed_image": proc_url,
        "overlay_image": over_url,
        "calibration_factor": project.calibration_factor,
        "calibration_unit": project.calibration_unit,
        "statistics": stats,
        "particles": [ParticleResponse.model_validate(p) for p in particles]
    }

