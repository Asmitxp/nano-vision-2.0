from sqlalchemy import Column, Integer, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Particle(Base):
    __tablename__ = "particles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    particle_number = Column(Integer, nullable=False)
    
    # Coordinates in pixels
    center_x = Column(Float, nullable=False)
    center_y = Column(Float, nullable=False)
    bbox_x = Column(Integer, nullable=False)
    bbox_y = Column(Integer, nullable=False)
    bbox_w = Column(Integer, nullable=False)
    bbox_h = Column(Integer, nullable=False)
    
    # Pixel measurements
    area_px = Column(Float, nullable=False)
    perimeter_px = Column(Float, nullable=False)
    ecd_px = Column(Float, nullable=False) # Equivalent Circular Diameter (sqrt(4 * area / pi))
    major_axis_px = Column(Float, nullable=False)
    minor_axis_px = Column(Float, nullable=False)
    feret_px = Column(Float, nullable=True) # Max caliper distance
    
    # Physical measurements (based on calibration factor)
    area_physical = Column(Float, nullable=False) # e.g. nm²
    perimeter_physical = Column(Float, nullable=False) # e.g. nm
    ecd_physical = Column(Float, nullable=False) # e.g. nm
    major_axis_physical = Column(Float, nullable=False)
    minor_axis_physical = Column(Float, nullable=False)
    feret_physical = Column(Float, nullable=True)
    
    # Morphology shape descriptors
    aspect_ratio = Column(Float, nullable=False) # major / minor
    circularity = Column(Float, nullable=False) # 4 * pi * area / (perimeter^2)
    
    # Scientific flags
    is_valid = Column(Boolean, default=True) # Manual override / active in stats
    is_uncertain = Column(Boolean, default=False) # Touching border, extreme aspect ratio, or low confidence
    
    # Contour points for interactive visualization
    contour_points = Column(Text, nullable=True) # JSON list of [x, y] coordinates
    
    # Relationship
    project = relationship("Project", back_populates="particles")

