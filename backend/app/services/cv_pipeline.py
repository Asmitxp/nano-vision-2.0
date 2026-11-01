import json
import uuid
import numpy as np
import cv2
from pathlib import Path
from typing import Dict, List, Tuple, Any
from scipy import ndimage
from skimage.feature import peak_local_max
from skimage.segmentation import watershed
from app.config import settings

class ComputerVisionPipeline:
    def __init__(self, settings_dict: Dict[str, Any] = None):
        self.settings = settings_dict or {}
        self.clahe_clip = float(self.settings.get("clahe_clip_limit", 2.5))
        self.blur_ksize = int(self.settings.get("gaussian_blur", 5))
        if self.blur_ksize % 2 == 0:
            self.blur_ksize += 1
        self.thresh_method = self.settings.get("threshold_method", "otsu")
        self.min_area_px = float(self.settings.get("min_area_px", 20))
        self.max_area_px = float(self.settings.get("max_area_px", 100000))
        self.use_watershed = bool(self.settings.get("watershed_enabled", True))
        self.dist_fraction = float(self.settings.get("watershed_distance_fraction", 0.35))
        self.exclude_border = bool(self.settings.get("exclude_border", False))
        self.invert_binary = bool(self.settings.get("invert_binary", False))

    def process_image(self, image_path: Path) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[Dict[str, Any]]]:
        """
        Executes complete scientific segmentation pipeline:
        Returns:
            original_bgr: np.ndarray
            processed_visual: np.ndarray (showing thresholded/distance features)
            overlay_bgr: np.ndarray (contours & labels drawn)
            detected_raw_particles: List of dicts with contour data
        """
        # 1. Load image
        img_bgr = cv2.imread(str(image_path))
        if img_bgr is None:
            raise ValueError(f"Could not read image file at {image_path}")
        
        h, w = img_bgr.shape[:2]
        
        # 2. Grayscale conversion
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # 3. Contrast enhancement using CLAHE
        clahe = cv2.createCLAHE(clipLimit=self.clahe_clip, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # 4. Noise reduction via Gaussian smoothing
        blurred = cv2.GaussianBlur(enhanced, (self.blur_ksize, self.blur_ksize), 0)
        
        # 5. Thresholding / Binarization
        if self.thresh_method == "otsu":
            _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        elif self.thresh_method == "adaptive_mean":
            binary = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 21, 5
            )
        else: # adaptive_gaussian
            binary = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 5
            )
            
        # Invert if particles are darker than background (TEM brightfield)
        if self.invert_binary:
            binary = cv2.bitwise_not(binary)
            
        # Auto-detect if background is white: in TEM brightfield, background is high intensity
        # Check corner border mean intensity
        border_sample = np.concatenate([
            binary[0:15, :].flatten(),
            binary[-15:, :].flatten(),
            binary[:, 0:15].flatten(),
            binary[:, -15:].flatten()
        ])
        if np.mean(border_sample) > 170 and not self.invert_binary:
            # The background is predominantly white; invert so particles are white (foreground)
            binary = cv2.bitwise_not(binary)
            
        # 6. Morphological opening and closing
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        # 7. Watershed Segmentation for touching particles
        labels = None
        if self.use_watershed:
            # Euclidean distance transform
            dist_transform = cv2.distanceTransform(closed, cv2.DIST_L2, 5)
            
            # Find local maxima peaks
            max_dist = dist_transform.max()
            if max_dist > 0:
                min_dist_threshold = self.dist_fraction * max_dist
                # Scikit-image peak_local_max provides robust local peaks
                coordinates = peak_local_max(
                    dist_transform, 
                    min_distance=max(3, int(self.blur_ksize)), 
                    threshold_abs=min_dist_threshold,
                    exclude_border=False
                )
                
                # Create markers for watershed
                markers = np.zeros(dist_transform.shape, dtype=np.int32)
                for idx, pt in enumerate(coordinates):
                    markers[pt[0], pt[1]] = idx + 1
                    
                if len(coordinates) > 0:
                    # Dilate markers slightly so watershed has regions
                    markers = ndimage.maximum_filter(markers, size=3)
                    labels = watershed(-dist_transform, markers, mask=closed)
                else:
                    _, labels = cv2.connectedComponents(closed)
            else:
                _, labels = cv2.connectedComponents(closed)
        else:
            _, labels = cv2.connectedComponents(closed)
            
        # 8. Extract individual particle contours & metadata
        particles_raw = []
        overlay_bgr = img_bgr.copy()
        processed_visual = cv2.cvtColor(closed, cv2.COLOR_GRAY2BGR)
        
        unique_labels = np.unique(labels)
        particle_idx = 1
        
        # Color palette for distinct segment highlighting
        colors = [
            (0, 255, 255),   # Cyan
            (0, 255, 128),   # Spring Green
            (255, 191, 0),   # Deep Sky / Amber
            (255, 105, 180), # Neon Pink
            (50, 205, 50),   # Lime Green
            (0, 191, 255),   # Sky Blue
            (186, 85, 211),  # Medium Orchid
        ]
        
        for lab in unique_labels:
            if lab == 0:
                continue # Background
                
            mask = np.uint8(labels == lab) * 255
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                continue
                
            cnt = max(contours, key=cv2.contourArea)
            area = float(cv2.contourArea(cnt))
            
            # Area filter check
            if area < self.min_area_px or area > self.max_area_px:
                continue
                
            perimeter = float(cv2.arcLength(cnt, True))
            if perimeter <= 0:
                continue
                
            # Bounding box
            bx, by, bw, bh = cv2.boundingRect(cnt)
            
            # Border proximity check
            touches_border = (bx <= 2 or by <= 2 or (bx + bw) >= w - 2 or (by + bh) >= h - 2)
            if touches_border and self.exclude_border:
                continue
                
            # Moments for centroid
            M = cv2.moments(cnt)
            if M["m00"] != 0:
                cx = float(M["m10"] / M["m00"])
                cy = float(M["m01"] / M["m00"])
            else:
                cx = float(bx + bw / 2.0)
                cy = float(by + bh / 2.0)
                
            # Fit ellipse if >= 5 points, else minAreaRect
            if len(cnt) >= 5:
                try:
                    ellipse = cv2.fitEllipse(cnt)
                    (_, _), (d1, d2), angle = ellipse
                    major_axis = float(max(d1, d2))
                    minor_axis = float(min(d1, d2))
                except Exception:
                    rect = cv2.minAreaRect(cnt)
                    major_axis = float(max(rect[1]))
                    minor_axis = float(min(rect[1]))
            else:
                rect = cv2.minAreaRect(cnt)
                major_axis = float(max(rect[1]))
                minor_axis = float(min(rect[1]))
                
            if minor_axis <= 0:
                minor_axis = major_axis if major_axis > 0 else 1.0
                
            # Equivalent Circular Diameter (ECD) = sqrt(4 * Area / pi)
            ecd_px = float(2.0 * np.sqrt(area / np.pi))
            
            # Maximum Feret diameter approximation (maximum distance between convex hull vertices)
            hull = cv2.convexHull(cnt)
            hull_points = hull.squeeze()
            feret_px = major_axis
            if len(hull_points.shape) == 2 and len(hull_points) > 1:
                # Pairwise distance maximum
                diff = hull_points[:, np.newaxis, :] - hull_points[np.newaxis, :, :]
                dists_sq = np.sum(diff ** 2, axis=-1)
                feret_px = float(np.sqrt(np.max(dists_sq)))
                
            # Aspect ratio and circularity
            aspect_ratio = float(major_axis / minor_axis)
            circularity = float((4.0 * np.pi * area) / (perimeter ** 2)) if perimeter > 0 else 0.0
            circularity = min(1.0, max(0.0, circularity))
            
            # Uncertainty flag: touching border, severe elongation (aspect_ratio > 3.5), or extremely low circularity (< 0.25)
            is_uncertain = bool(touches_border or aspect_ratio > 3.8 or circularity < 0.28)
            
            # Simplified polygon coordinates for interactive SVG rendering
            epsilon = 0.012 * perimeter
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            poly_points = approx.reshape(-1, 2).tolist()
            
            particles_raw.append({
                "particle_number": particle_idx,
                "center_x": cx,
                "center_y": cy,
                "bbox_x": int(bx),
                "bbox_y": int(by),
                "bbox_w": int(bw),
                "bbox_h": int(bh),
                "area_px": area,
                "perimeter_px": perimeter,
                "ecd_px": ecd_px,
                "major_axis_px": major_axis,
                "minor_axis_px": minor_axis,
                "feret_px": feret_px,
                "aspect_ratio": aspect_ratio,
                "circularity": circularity,
                "is_uncertain": is_uncertain,
                "is_valid": True,
                "contour_points": json.dumps(poly_points)
            })
            
            # Draw visual overlay
            color = colors[(particle_idx - 1) % len(colors)]
            if is_uncertain:
                draw_color = (0, 140, 255) # Orange for uncertain
            else:
                draw_color = color
                
            cv2.drawContours(overlay_bgr, [cnt], -1, draw_color, 2)
            cv2.circle(overlay_bgr, (int(cx), int(cy)), 3, (255, 255, 255), -1)
            
            # Text label for ID
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = max(0.35, min(0.6, bw / 60.0))
            cv2.putText(
                overlay_bgr, 
                str(particle_idx), 
                (int(cx) + 4, int(cy) - 4), 
                font, 
                font_scale, 
                (255, 255, 255), 
                1, 
                cv2.LINE_AA
            )
            
            particle_idx += 1
            
        return img_bgr, processed_visual, overlay_bgr, particles_raw

