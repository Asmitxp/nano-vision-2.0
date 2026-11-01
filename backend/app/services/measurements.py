import math
from typing import Dict, Any, List

def compute_physical_measurements(
    particle_raw: Dict[str, Any], 
    calibration_factor: float
) -> Dict[str, Any]:
    """
    Computes calibrated physical dimensions from raw pixel measurements.
    linear_dim_phys = linear_dim_px * calibration_factor
    area_phys = area_px * (calibration_factor ^ 2)
    """
    factor = float(calibration_factor) if calibration_factor > 0 else 1.0
    factor_sq = factor * factor

    area_px = particle_raw["area_px"]
    perimeter_px = particle_raw["perimeter_px"]
    ecd_px = particle_raw["ecd_px"]
    major_px = particle_raw["major_axis_px"]
    minor_px = particle_raw["minor_axis_px"]
    feret_px = particle_raw.get("feret_px") or major_px

    area_phys = round(area_px * factor_sq, 3)
    perimeter_phys = round(perimeter_px * factor, 3)
    ecd_phys = round(ecd_px * factor, 3)
    major_phys = round(major_px * factor, 3)
    minor_phys = round(minor_px * factor, 3)
    feret_phys = round(feret_px * factor, 3)

    return {
        **particle_raw,
        "area_physical": area_phys,
        "perimeter_physical": perimeter_phys,
        "ecd_physical": ecd_phys,
        "major_axis_physical": major_phys,
        "minor_axis_physical": minor_phys,
        "feret_physical": feret_phys,
    }

