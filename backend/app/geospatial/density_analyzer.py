from __future__ import annotations

import numpy as np

from app.satellite import ndvi as ndvi_mod


def analyze_density(ndvi: np.ndarray) -> dict:
    mean_ndvi = float(np.mean(ndvi))
    canopy_density_pct = round(max(0.0, min(1.0, (mean_ndvi + 1) / 2)) * 100, 1)
    return {
        "mean_ndvi": round(mean_ndvi, 4),
        "canopy_density_pct": canopy_density_pct,
        "vegetation_health_index": round(float(np.mean(np.clip(ndvi, 0, 1))), 3),
        "tiers": ndvi_mod.tier_histogram(ndvi),
        "grid_size": ndvi.shape[0],
        # downsampled preview grid so the frontend can render a heatmap without
        # shipping the full raster
        "preview": _downsample(ndvi, 16).tolist(),
    }


def _downsample(arr: np.ndarray, target: int) -> np.ndarray:
    factor = max(1, arr.shape[0] // target)
    trimmed = arr[: (arr.shape[0] // factor) * factor, : (arr.shape[1] // factor) * factor]
    reshaped = trimmed.reshape(trimmed.shape[0] // factor, factor, trimmed.shape[1] // factor, factor)
    return reshaped.mean(axis=(1, 3)).round(3)
