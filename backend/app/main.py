import shutil
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.particle import Particle
from app.utils.security import hash_password
from app.utils.sample_generator import generate_benchmark_micrographs
from app.services.cv_pipeline import ComputerVisionPipeline
from app.services.measurements import compute_physical_measurements
from app.services.statistics import calculate_particle_statistics

# Routers
from app.routers import auth, upload, projects, analysis, chatbot, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Startup: Ensure tables exist
        Base.metadata.create_all(bind=engine)
        
        # Generate realistic sample benchmarks
        sem_path, tem_path = generate_benchmark_micrographs()
        
        # Seed default researcher user and demo project if empty
        db = SessionLocal()
        try:
        user = db.query(User).filter(User.email == "researcher@nanovision.ai").first()
        if not user:
            user = User(
                email="researcher@nanovision.ai",
                full_name="Dr. Elena Vance (Lead Metrologist)",
                hashed_password=hash_password("nanovision2026"),
                role="Senior Nanoscientist"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Seed initial analyzed demo project if none exists
        existing_projects = db.query(Project).filter(Project.user_id == user.id).first()
        if not existing_projects and sem_path.exists():
            # Copy sample into uploads directory
            demo_img_name = "demo_sem_gold_nanoparticles.png"
            dest = settings.UPLOAD_PATH / demo_img_name
            shutil.copyfile(sem_path, dest)

            demo_project = Project(
                user_id=user.id,
                title="Monodisperse AuNP Synthesis (Batch #4B)",
                description="Field Emission SEM characterization of colloidal gold nanoparticles stabilized with sodium citrate.",
                image_type="SEM",
                original_image=f"uploads/{demo_img_name}",
                image_width=800,
                image_height=600,
                calibration_method="scale_bar",
                calibration_factor=1.6667, # 200 nm / 120 pixels
                calibration_unit="nm",
                status="analyzed"
            )
            db.add(demo_project)
            db.commit()
            db.refresh(demo_project)

            # Run CV pipeline to generate real baseline particles & overlay
            pipeline = ComputerVisionPipeline({
                "clahe_clip_limit": 2.5,
                "gaussian_blur": 5,
                "threshold_method": "otsu",
                "watershed_enabled": True,
                "watershed_distance_fraction": 0.35,
                "min_area_px": 50,
                "max_area_px": 20000,
            })
            
            import cv2, uuid
            _, proc_bgr, over_bgr, raw_particles = pipeline.process_image(dest)
            
            proc_name = f"proc_seed_{uuid.uuid4().hex[:8]}.png"
            over_name = f"over_seed_{uuid.uuid4().hex[:8]}.png"
            cv2.imwrite(str(settings.UPLOAD_PATH / proc_name), proc_bgr)
            cv2.imwrite(str(settings.UPLOAD_PATH / over_name), over_bgr)

            demo_project.processed_image = f"uploads/{proc_name}"
            demo_project.overlay_image = f"uploads/{over_name}"

            factor = demo_project.calibration_factor
            db_particles = []
            stat_dicts = []
            for rp in raw_particles:
                pm = compute_physical_measurements(rp, factor)
                db_p = Particle(
                    project_id=demo_project.id,
                    particle_number=pm["particle_number"],
                    center_x=pm["center_x"],
                    center_y=pm["center_y"],
                    bbox_x=pm["bbox_x"],
                    bbox_y=pm["bbox_y"],
                    bbox_w=pm["bbox_w"],
                    bbox_h=pm["bbox_h"],
                    area_px=pm["area_px"],
                    perimeter_px=pm["perimeter_px"],
                    ecd_px=pm["ecd_px"],
                    major_axis_px=pm["major_axis_px"],
                    minor_axis_px=pm["minor_axis_px"],
                    feret_px=pm["feret_px"],
                    area_physical=pm["area_physical"],
                    perimeter_physical=pm["perimeter_physical"],
                    ecd_physical=pm["ecd_physical"],
                    major_axis_physical=pm["major_axis_physical"],
                    minor_axis_physical=pm["minor_axis_physical"],
                    feret_physical=pm["feret_physical"],
                    aspect_ratio=pm["aspect_ratio"],
                    circularity=pm["circularity"],
                    is_valid=pm["is_valid"],
                    is_uncertain=pm["is_uncertain"],
                    contour_points=pm["contour_points"]
                )
                db_particles.append(db_p)
                stat_dicts.append(pm)

            db.add_all(db_particles)
            stats = calculate_particle_statistics(stat_dicts, unit=demo_project.calibration_unit)

            demo_project.total_particles = len(db_particles)
            demo_project.mean_diameter = stats["mean_diameter"]
            demo_project.median_diameter = stats["median_diameter"]
            demo_project.std_diameter = stats["std_diameter"]
            demo_project.min_diameter = stats["min_diameter"]
            demo_project.max_diameter = stats["max_diameter"]
            demo_project.p25_diameter = stats["p25_diameter"]
            demo_project.p75_diameter = stats["p75_diameter"]
            demo_project.cv_diameter = stats["cv_percent"]
            db.commit()
            print(f"[NanoVision] Seeded project '{demo_project.title}' with {len(db_particles)} detected particles.")
    except Exception as e:
        print(f"[NanoVision Startup Warning] Database init/seeding error: {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scientific platform for AI-assisted nanoparticle size metrology from SEM and TEM electron micrographs.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(upload.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NanoVision Metrology Engine",
        "version": settings.VERSION
    }

