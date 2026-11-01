# NanoVision AI
### AI-Powered Automated Nanoparticle Size Analysis from SEM and TEM Micrographs

[![Platform](https://img.shields.io/badge/Platform-FastAPI%20%7C%20Next.js%2014-cyan)](https://github.com)
[![Computer Vision](https://img.shields.io/badge/CV-OpenCV%20%7C%20Scikit--Image%20%7C%20SciPy-blue)](https://github.com)
[![Metrology](https://img.shields.io/badge/Metrology-ISO%2013322--1%20Compliant-emerald)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-purple)](https://github.com)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Asmitxp/nano-vision-2.0)

---

## 1. Project Overview

**NanoVision** is an AI-assisted scientific platform designed to transform raw Scanning Electron Microscopy (**SEM**) and Transmission Electron Microscopy (**TEM**) micrographs into quantitative nanoparticle size distributions, morphological metrics, and publication-ready academic reports.

Unlike superficial web dashboards or static image viewers, NanoVision executes a **real computer vision segmentation pipeline**:
- **Contrast-Limited Adaptive Histogram Equalization (CLAHE)** to eliminate non-uniform electron beam illumination.
- **Euclidean Distance Transformation** to locate topographic particle centers.
- **Marker-Controlled Watershed Segmentation** to reliably separate touching or clustered nanoparticles at contact necks.
- **Precision Scale Calibration** via manual two-point baseline or scale-bar detection, converting pixels into physical SI dimensions ($\text{nm}$, $\mu\text{m}$, $\text{\AA}$).
- **Nanoparticle Morphology Metrology** calculating Equivalent Circular Diameter (ECD), Maximum Feret Diameter, Major/Minor Axis lengths, Aspect Ratio, and Circularity.
- **Statistical Polydispersity Analysis** calculating Mean, Median ($D_{50}$), Standard Deviation ($\sigma$), Interquartile Range (IQR $P_{25}-P_{75}$), and Coefficient of Variation ($CV\%$).
- **NanoBot Research Assistant**, a context-aware AI chatbot that reads current sample measurements and explains microscopy physics, segmentation parameters, and synthesis mechanisms.
- **Multi-Format Scientific Export** generating publication-style PDF reports with embedded micrograph figures, multi-sheet Excel (`.xlsx`) workbooks, and CSV data.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14 (React 18, App Router, TypeScript)
- **Styling:** Tailwind CSS with Dark Scientific Navy Theme, Cyan/Electric Blue accents, Glassmorphism
- **3D Visualization:** Three.js 3D Microscopic Particle Field with interactive mouse reactivity and scanning plane
- **Scientific Plotting:** Recharts (Frequency Histograms, Cumulative Distribution CDF, Relative % Density curves)
- **Icons:** Lucide React

### Backend
- **Framework:** Python 3.10+ / 3.14 with FastAPI
- **Computer Vision & Scientific Algorithms:** OpenCV (`cv2`), Scikit-Image (`skimage`), SciPy, NumPy, Pandas
- **Database & ORM:** SQLAlchemy with SQLite (default zero-config local run) or PostgreSQL
- **Security & Auth:** Bcrypt password hashing, PyJWT JSON Web Tokens
- **Report Generation:** ReportLab (Academic PDF generator), OpenPyXL (Excel `.xlsx`), CSV

---

## 3. Scientific Pipeline & Algorithms

```
Raw SEM / TEM Micrograph
          │
          ▼
Magic Bytes File Signature Validation (.png, .jpg, .tif, .bmp)
          │
          ▼
Contrast Enhancement (CLAHE) & Gaussian Noise Reduction
          │
          ▼
Binarization (Otsu Adaptive Bimodal Thresholding)
          │
          ▼
Euclidean Distance Transform: D(p) = min ||p - q||_2
          │
          ▼
Topological Peak Finding & Marker Generation
          │
          ▼
Marker-Controlled Watershed Separation of Touching Colloids
          │
          ▼
Boundary Contour Extraction, Moments & Centroid Calculation
          │
          ▼
Scale Factor Conversion (Physical Units: nm, µm, Å)
          │
          ▼
Metrology Computation (ECD, Feret, Aspect Ratio, Circularity)
          │
          ▼
Interactive Charts (Histogram, CDF) & Multi-Format Reports (PDF / Excel / CSV)
```

### Key Mathematical Formulas

1. **Equivalent Circular Diameter (ECD):**
   $$ECD = 2 \times \sqrt{\frac{Area}{\pi}} = \sqrt{\frac{4 \times Area}{\pi}}$$

2. **Scale Calibration Factor ($F$):**
   $$F = \frac{L_{\text{known physical}}}{D_{\text{pixels}}} \quad \left[\frac{\text{nm}}{\text{pixel}}\right]$$

3. **Coefficient of Variation ($CV\%$ / Polydispersity):**
   $$CV\% = \left(\frac{\sigma}{\mu}\right) \times 100$$
   - $CV < 15\%$: Monodisperse population (ideal for standards and optical applications).
   - $CV > 25\%$: Polydisperse sample indicating secondary nucleation or ripening.

4. **Circularity Index ($C$):**
   $$C = \frac{4 \pi \times Area}{Perimeter^2} \quad (0 \le C \le 1)$$

---

## 4. Quick Start & Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend automatically creates database tables, generates realistic benchmark micrographs (`sem_gold_nanoparticles.png`, `tem_silver_nanoparticles.png`), and seeds initial demonstration samples.*

### 2. Frontend Setup
```bash
# Open a second terminal and navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 5. Pre-Configured Demo Credentials

For quick evaluation without manual registration:
- **Email:** `researcher@nanovision.ai`
- **Password:** `nanovision2026`

---

## 6. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT bearer token |
| `POST` | `/api/auth/register` | Register new researcher account |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/upload` | Upload micrograph with deep magic-bytes validation |
| `GET` | `/api/upload/file/{name}` | Serve uploaded / processed micrograph files |
| `GET` | `/api/projects` | List all microscopy projects for active user |
| `GET` | `/api/projects/dashboard-stats`| Aggregated database statistics (images, particles, mean size) |
| `POST` | `/api/projects/compare` | Multi-sample statistical comparison |
| `POST` | `/api/analysis/calibrate/{id}` | Apply manual 2-point or scale-bar calibration |
| `POST` | `/api/analysis/run/{id}` | Run watershed segmentation & particle metrology |
| `POST` | `/api/analysis/toggle-particle/{id}` | Toggle particle inclusion in statistical calculations |
| `POST` | `/api/chatbot/query` | Grounded scientific Q&A with NanoBot |
| `GET` | `/api/reports/pdf/{id}` | Download academic PDF report with embedded figures |
| `GET` | `/api/reports/excel/{id}` | Download multi-sheet Excel dataset (`.xlsx`) |
| `GET` | `/api/reports/csv/{id}` | Download particle metrics CSV |

---

## 7. License
Distributed under the MIT License. Developed for advanced scientific computing and academic research.

