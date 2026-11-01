import numpy as np
import cv2
from pathlib import Path
from app.config import settings

def generate_benchmark_micrographs():
    """Generates realistic synthetic SEM and TEM benchmark micrographs for testing."""
    sample_dir = settings.SAMPLE_PATH
    sample_dir.mkdir(parents=True, exist_ok=True)

    # 1. SEM Gold Nanoparticles (Bright particles on dark carbon substrate)
    sem_path = sample_dir / "sem_gold_nanoparticles.png"
    if not sem_path.exists():
        w, h = 800, 600
        # Background: noisy dark carbon substrate
        img = np.random.normal(45, 8, (h, w)).astype(np.float32)
        # Substrate background low-frequency gradient
        y, x = np.mgrid[0:h, 0:w]
        gradient = (x / w) * 10 + (y / h) * 15
        img += gradient
        
        # Place 65 pseudo-spherical gold nanoparticles
        np.random.seed(42)
        particles = []
        for _ in range(65):
            cx = np.random.randint(60, w - 80)
            cy = np.random.randint(60, h - 90)
            radius = np.random.randint(12, 38)
            particles.append((cx, cy, radius))
            
        # Draw particles with SEM edge bloom effect (brighter edges due to secondary electron emission)
        for cx, cy, r in particles:
            cv2.circle(img, (cx, cy), r, 160, -1)
            # Edge brightness
            cv2.circle(img, (cx, cy), r, 220, 2)
            # Center subtle core
            cv2.circle(img, (cx, cy), max(2, r - 4), 180, -1)

        # Smooth and add fine electron shot noise
        img = cv2.GaussianBlur(img, (3, 3), 0)
        noise = np.random.normal(0, 5, (h, w))
        img = np.clip(img + noise, 0, 255).astype(np.uint8)

        # Draw realistic scientific scale bar block (e.g., 200 nm = 120 pixels -> ~1.67 nm/pixel)
        cv2.rectangle(img, (w - 220, h - 55), (w - 30, h - 15), 20, -1)
        cv2.line(img, (w - 190, h - 35), (w - 70, h - 35), 255, 3) # 120 px line
        cv2.putText(img, "200 nm", (w - 155, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)

        cv2.imwrite(str(sem_path), img)

    # 2. TEM Silver Nanoparticles (Dark particles on light background, brightfield TEM)
    tem_path = sample_dir / "tem_silver_nanoparticles.png"
    if not tem_path.exists():
        w, h = 800, 600
        # Background: light amorphous carbon film with subtle grain
        img = np.random.normal(210, 6, (h, w)).astype(np.float32)
        
        np.random.seed(101)
        tem_particles = []
        # Place some single and touching pairs
        for _ in range(50):
            cx = np.random.randint(60, w - 80)
            cy = np.random.randint(60, h - 90)
            r = np.random.randint(10, 32)
            tem_particles.append((cx, cy, r))
            # 30% chance of a touching neighbor particle (agglomerate)
            if np.random.rand() < 0.35:
                angle = np.random.uniform(0, 2 * np.pi)
                dist = int(r * 1.55)
                nx = int(cx + dist * np.cos(angle))
                ny = int(cy + dist * np.sin(angle))
                nr = int(r * np.random.uniform(0.75, 1.15))
                if 50 < nx < w - 60 and 50 < ny < h - 70:
                    tem_particles.append((nx, ny, nr))

        for cx, cy, r in tem_particles:
            # Mass-thickness contrast: core is very dark (high electron scattering)
            cv2.circle(img, (cx, cy), r, 50, -1)
            cv2.circle(img, (cx, cy), max(2, r - 3), 35, -1)
            # Diffuse carbon/surfactant halo
            cv2.circle(img, (cx, cy), r + 2, 175, 1)

        img = cv2.GaussianBlur(img, (3, 3), 0)
        noise = np.random.normal(0, 4, (h, w))
        img = np.clip(img + noise, 0, 255).astype(np.uint8)

        # Scale bar: 100 nm = 150 pixels -> 0.667 nm/pixel
        cv2.rectangle(img, (w - 240, h - 55), (w - 30, h - 15), 235, -1)
        cv2.line(img, (w - 200, h - 35), (w - 50, h - 35), 20, 3) # 150 px line
        cv2.putText(img, "100 nm", (w - 145, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 20, 1)

        cv2.imwrite(str(tem_path), img)

    return sem_path, tem_path

