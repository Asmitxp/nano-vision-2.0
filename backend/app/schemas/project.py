from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_type: str = "SEM" # SEM or TEM

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_type: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    image_type: str
    original_image: str
    processed_image: Optional[str] = None
    overlay_image: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    calibration_method: str
    calibration_factor: float
    calibration_unit: str
    total_particles: int
    mean_diameter: Optional[float] = None
    median_diameter: Optional[float] = None
    std_diameter: Optional[float] = None
    min_diameter: Optional[float] = None
    max_diameter: Optional[float] = None
    p25_diameter: Optional[float] = None
    p75_diameter: Optional[float] = None
    cv_diameter: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_images: int
    total_particles: int
    avg_particle_diameter: float
    recent_projects: List[ProjectResponse]

