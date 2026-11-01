from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CalibrationRequest(BaseModel):
    method: str = Field(..., description="'manual' or 'scale_bar'")
    point1: Optional[List[float]] = None # [x, y]
    point2: Optional[List[float]] = None # [x, y]
    scale_bar_bbox: Optional[List[float]] = None # [x, y, w, h]
    known_distance: float = Field(..., gt=0, description="Real world length")
    unit: str = Field("nm", description="'nm', 'µm', 'Å'")

class CalibrationResponse(BaseModel):
    pixel_distance: float
    known_distance: float
    unit: str
    calibration_factor: float # physical unit per pixel
    pixels_per_unit: float
    message: str

class DetectionSettings(BaseModel):
    clahe_clip_limit: float = Field(2.5, ge=0.5, le=10.0)
    gaussian_blur: int = Field(5, ge=1, le=25)
    threshold_method: str = Field("otsu", description="'otsu', 'adaptive_gaussian', 'adaptive_mean'")
    min_area_px: int = Field(20, ge=2)
    max_area_px: int = Field(100000, ge=10)
    watershed_enabled: bool = True
    watershed_distance_fraction: float = Field(0.35, ge=0.05, le=0.95)
    exclude_border: bool = False
    invert_binary: bool = False # If particles are darker than background (TEM often has dark particles on light background!)

class ParticleResponse(BaseModel):
    id: int
    particle_number: int
    center_x: float
    center_y: float
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    area_px: float
    perimeter_px: float
    ecd_px: float
    major_axis_px: float
    minor_axis_px: float
    feret_px: Optional[float] = None
    area_physical: float
    perimeter_physical: float
    ecd_physical: float
    major_axis_physical: float
    minor_axis_physical: float
    feret_physical: Optional[float] = None
    aspect_ratio: float
    circularity: float
    is_valid: bool
    is_uncertain: bool
    contour_points: Optional[str] = None # JSON string

    class Config:
        from_attributes = True

class ParticleToggleRequest(BaseModel):
    particle_id: int
    is_valid: bool

class HistogramBin(BaseModel):
    bin_start: float
    bin_end: float
    bin_mid: float
    count: int
    frequency: float

class CumulativePoint(BaseModel):
    diameter: float
    cumulative_percentage: float

class AnalysisStatistics(BaseModel):
    total_detected: int
    valid_count: int
    uncertain_count: int
    unit: str
    mean_diameter: float
    median_diameter: float
    std_diameter: float
    min_diameter: float
    max_diameter: float
    p25_diameter: float
    p75_diameter: float
    cv_percent: float
    mean_aspect_ratio: float
    mean_circularity: float
    histogram: List[HistogramBin]
    cumulative_distribution: List[CumulativePoint]

class AnalysisResponse(BaseModel):
    project_id: int
    status: str
    original_image: str
    processed_image: str
    overlay_image: str
    calibration_factor: float
    calibration_unit: str
    statistics: AnalysisStatistics
    particles: List[ParticleResponse]

