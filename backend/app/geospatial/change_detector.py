from __future__ import annotations

import numpy as np
from scipy import ndimage

SEVERE_DROP_THRESHOLD = -0.25


def compute_delta(ndvi_before: np.ndarray, ndvi_after: np.ndarray) -> np.ndarray:
    return ndvi_after - ndvi_before


def severe_loss_mask(delta: np.ndarray) -> np.ndarray:
    """Binary mask of pixels with severe vegetation loss, cleaned up with
    a light erosion + dilation pass (removes single-pixel noise, then
    restores the boundary) — the numpy/scipy equivalent of the
    OpenCV morphological open used in the reference design."""
    raw_mask = delta < SEVERE_DROP_THRESHOLD
    structure = np.ones((3, 3), dtype=bool)
    eroded = ndimage.binary_erosion(raw_mask, structure=structure, border_value=0)
    cleaned = ndimage.binary_dilation(eroded, structure=structure, border_value=0)
    return cleaned
