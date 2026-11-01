import numpy as np
from typing import List, Dict, Any

def calculate_particle_statistics(
    particles: List[Dict[str, Any]], 
    unit: str = "nm",
    num_bins: int = 15
) -> Dict[str, Any]:
    """
    Computes rigorous statistical distributions and histogram bins
    for valid detected particles.
    """
    if not particles:
        return {
            "total_detected": 0,
            "valid_count": 0,
            "uncertain_count": 0,
            "unit": unit,
            "mean_diameter": 0.0,
            "median_diameter": 0.0,
            "std_diameter": 0.0,
            "min_diameter": 0.0,
            "max_diameter": 0.0,
            "p25_diameter": 0.0,
            "p75_diameter": 0.0,
            "cv_percent": 0.0,
            "mean_aspect_ratio": 0.0,
            "mean_circularity": 0.0,
            "histogram": [],
            "cumulative_distribution": []
        }

    total_detected = len(particles)
    valid_particles = [p for p in particles if p.get("is_valid", True)]
    uncertain_count = len([p for p in particles if p.get("is_uncertain", False)])
    
    if not valid_particles:
        # If all were unselected, use full set with flag
        valid_particles = particles

    valid_count = len(valid_particles)
    diameters = np.array([p["ecd_physical"] for p in valid_particles], dtype=float)
    aspect_ratios = np.array([p["aspect_ratio"] for p in valid_particles], dtype=float)
    circularities = np.array([p["circularity"] for p in valid_particles], dtype=float)

    mean_d = float(np.mean(diameters))
    median_d = float(np.median(diameters))
    std_d = float(np.std(diameters))
    min_d = float(np.min(diameters))
    max_d = float(np.max(diameters))
    p25_d = float(np.percentile(diameters, 25))
    p75_d = float(np.percentile(diameters, 75))
    cv_pct = float((std_d / mean_d * 100.0) if mean_d > 0 else 0.0)
    
    mean_ar = float(np.mean(aspect_ratios))
    mean_circ = float(np.mean(circularities))

    # Compute Histogram
    if min_d == max_d:
        # Uniform size
        hist_bins = [{
            "bin_start": round(min_d - 0.5, 2),
            "bin_end": round(max_d + 0.5, 2),
            "bin_mid": round(min_d, 2),
            "count": valid_count,
            "frequency": 100.0
        }]
    else:
        counts, bin_edges = np.histogram(diameters, bins=num_bins)
        hist_bins = []
        for i in range(len(counts)):
            b_start = round(float(bin_edges[i]), 2)
            b_end = round(float(bin_edges[i + 1]), 2)
            b_mid = round((b_start + b_end) / 2.0, 2)
            count = int(counts[i])
            freq = round((count / valid_count) * 100.0, 2)
            hist_bins.append({
                "bin_start": b_start,
                "bin_end": b_end,
                "bin_mid": b_mid,
                "count": count,
                "frequency": freq
            })

    # Compute Cumulative Size Distribution (CDF)
    sorted_d = np.sort(diameters)
    cum_pct = (np.arange(1, valid_count + 1) / valid_count) * 100.0
    
    # Downsample points for smooth display if many particles
    step = max(1, len(sorted_d) // 40)
    cdf_points = []
    for idx in range(0, len(sorted_d), step):
        cdf_points.append({
            "diameter": round(float(sorted_d[idx]), 2),
            "cumulative_percentage": round(float(cum_pct[idx]), 2)
        })
    # Ensure final 100% point is included
    if cdf_points[-1]["cumulative_percentage"] < 100.0:
        cdf_points.append({
            "diameter": round(float(sorted_d[-1]), 2),
            "cumulative_percentage": 100.0
        })

    return {
        "total_detected": total_detected,
        "valid_count": valid_count,
        "uncertain_count": uncertain_count,
        "unit": unit,
        "mean_diameter": round(mean_d, 2),
        "median_diameter": round(median_d, 2),
        "std_diameter": round(std_d, 2),
        "min_diameter": round(min_d, 2),
        "max_diameter": round(max_d, 2),
        "p25_diameter": round(p25_d, 2),
        "p75_diameter": round(p75_d, 2),
        "cv_percent": round(cv_pct, 2),
        "mean_aspect_ratio": round(mean_ar, 2),
        "mean_circularity": round(mean_circ, 2),
        "histogram": hist_bins,
        "cumulative_distribution": cdf_points
    }

