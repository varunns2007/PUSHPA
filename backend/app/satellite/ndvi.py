from __future__ import annotations

import numpy as np

# NDVI classification tiers, per the PUSHPA spec.
TIERS = [
    (0.0, 0.2, "BARE_SOIL_CLEARED"),
    (0.2, 0.4, "SPARSE_VEGETATION"),
    (0.4, 0.6, "MODERATE_DECIDUOUS"),
    (0.6, 0.8, "DENSE_EVERGREEN"),
    (0.8, 1.01, "PRISTINE_HIGH_CANOPY"),
]


def compute_ndvi(b04_red: np.ndarray, b08_nir: np.ndarray) -> np.ndarray:
    """NDVI = (NIR - Red) / (NIR + Red), safe against zero-division."""
    denom = b08_nir + b04_red
    denom = np.where(denom == 0, 1e-6, denom)
    ndvi = (b08_nir - b04_red) / denom
    return np.clip(ndvi, -1.0, 1.0)


def classify_tier(value: float) -> str:
    for lo, hi, label in TIERS:
        if lo <= value < hi:
            return label
    return "PRISTINE_HIGH_CANOPY" if value >= 0.8 else "BARE_SOIL_CLEARED"


def tier_histogram(ndvi: np.ndarray) -> list[dict]:
    total = ndvi.size
    out = []
    for lo, hi, label in TIERS:
        count = int(np.sum((ndvi >= lo) & (ndvi < hi)))
        out.append({"tier": label, "range": [lo, min(hi, 1.0)], "pixel_count": count, "pct": round(100 * count / total, 2)})
    return out
