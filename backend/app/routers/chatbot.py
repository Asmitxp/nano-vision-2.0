from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.particle import Particle
from app.routers.auth import get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import query_nanobot
from app.services.statistics import calculate_particle_statistics

router = APIRouter(prefix="/chatbot", tags=["NanoBot AI Assistant"])

@router.post("/query", response_model=ChatResponse)
async def chat_with_nanobot(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project_context = None
    project_title = None
    stats_summary = None

    if req.project_id:
        project = db.query(Project).filter(
            Project.id == req.project_id,
            Project.user_id == current_user.id
        ).first()

        if project:
            project_title = project.title
            particles = db.query(Particle).filter(Particle.project_id == project.id).all()
            p_dicts = [{
                "ecd_physical": p.ecd_physical,
                "aspect_ratio": p.aspect_ratio,
                "circularity": p.circularity,
                "is_valid": p.is_valid,
                "is_uncertain": p.is_uncertain
            } for p in particles]
            
            stats = calculate_particle_statistics(p_dicts, unit=project.calibration_unit)
            stats_summary = {
                "project_title": project.title,
                "image_type": project.image_type,
                "calibration_factor": project.calibration_factor,
                "unit": project.calibration_unit,
                "total_particles": len(particles),
                "valid_count": stats.get("valid_count", 0),
                "uncertain_count": stats.get("uncertain_count", 0),
                "mean_diameter": stats.get("mean_diameter", 0),
                "median_diameter": stats.get("median_diameter", 0),
                "std_diameter": stats.get("std_diameter", 0),
                "min_diameter": stats.get("min_diameter", 0),
                "max_diameter": stats.get("max_diameter", 0),
                "cv_percent": stats.get("cv_percent", 0),
            }
            project_context = stats_summary

    history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    reply = await query_nanobot(
        user_message=req.message,
        project_context=project_context,
        chat_history=history_dicts
    )

    return ChatResponse(
        reply=reply,
        context_applied=bool(project_context is not None),
        project_title=project_title,
        stats_summary=stats_summary
    )

