import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_type = Column(String(10), default="SEM") # SEM or TEM
    
    # Image file paths (relative to backend root)
    original_image = Column(String(500), nullable=False)
    processed_image = Column(String(500), nullable=True)
    overlay_image = Column(String(500), nullable=True)
    
    # Image properties
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    
    # Calibration
    calibration_method = Column(String(50), default="uncalibrated") # manual, scale_bar, uncalibrated
    calibration_factor = Column(Float, default=1.0) # Physical units per pixel (e.g. 0.45 nm/pixel)
    calibration_unit = Column(String(20), default="nm") # nm, µm, Å, px
    scale_bar_info = Column(Text, nullable=True) # JSON details if scale bar used
    
    # Detection configuration
    detection_settings = Column(Text, nullable=True) # JSON string
    
    # Statistical summaries
    total_particles = Column(Integer, default=0)
    mean_diameter = Column(Float, nullable=True)
    median_diameter = Column(Float, nullable=True)
    std_diameter = Column(Float, nullable=True)
    min_diameter = Column(Float, nullable=True)
    max_diameter = Column(Float, nullable=True)
    p25_diameter = Column(Float, nullable=True)
    p75_diameter = Column(Float, nullable=True)
    cv_diameter = Column(Float, nullable=True) # Coefficient of variation (%)
    
    status = Column(String(50), default="uploaded") # uploaded, calibrated, analyzed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    particles = relationship("Particle", back_populates="project", cascade="all, delete-orphan")

