from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.particle import Particle
from app.routers.auth import get_current_user
from app.services.statistics import calculate_particle_statistics
from app.services.report_service import generate_pdf_report, generate_excel_report, generate_csv_report

router = APIRouter(prefix="/reports", tags=["Scientific Reports"])

@router.get("/pdf/{project_id}")
def download_pdf_report(
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

    pdf_stream = generate_pdf_report(project, particles, stats, user_name=current_user.full_name)
    
    clean_title = "".join(c for c in project.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"NanoVision_Report_{clean_title}_{project.id}.pdf"

    return Response(
        content=pdf_stream.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/excel/{project_id}")
def download_excel_report(
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

    excel_stream = generate_excel_report(project, particles, stats)
    clean_title = "".join(c for c in project.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"NanoVision_Data_{clean_title}_{project.id}.xlsx"

    return Response(
        content=excel_stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/csv/{project_id}")
def download_csv_report(
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

    csv_content = generate_csv_report(project, particles, stats)
    clean_title = "".join(c for c in project.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"NanoVision_Metrics_{clean_title}_{project.id}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

