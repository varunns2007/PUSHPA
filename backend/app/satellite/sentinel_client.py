"""
Synthetic Sentinel-2 client.

This project does not ship real Copernicus Data Space Ecosystem credentials,
so this module generates plausible, deterministic-per-seed B04 (Red) and B08
(Near-Infrared) reflectance rasters instead of querying orbit. The output
shape and value ranges mimic Sentinel-2 Level-2A surface reflectance
(0.0-1.0 float, after the /10000 scale factor Sentinel-2 normally ships in),
so `ndvi.py` and everything downstream works unmodified against a real
client later — only this file needs to be replaced.

To wire in the real thing: implement `fetch_bands()` against the Copernicus
Data Space Ecosystem OData/STAC API using an `openeo` or `sentinelhub`
client authenticated via OAuth2, apply the Scene Classification Layer (SCL)
cloud/water mask, and return the same (band04, band08) tuple shape.
"""
from __future__ import annotations

import hashlib

import numpy as np

GRID_SIZE = 64  # 64x64 synthetic tile, kept small for fast in-browser demo use


def _seeded_rng(seed_key: str) -> np.random.Generator:
    digest = hashlib.sha256(seed_key.encode()).digest()
    seed = int.from_bytes(digest[:8], "big")
    return np.random.default_rng(seed)


def fetch_bands(zone_id: str, observation_date: str, clearing_severity: float = 0.0) -> dict[str, np.ndarray]:
    """
    Return synthetic B04 (red) / B08 (NIR) reflectance rasters for a zone
    on a given observation date.

    `clearing_severity` (0.0-1.0) optionally depresses NIR / raises Red
    reflectance over a patch of the tile, simulating a canopy-loss event so
    that "before" vs "after" calls can demonstrate real NDVI change.
    """
    rng = _seeded_rng(f"{zone_id}:{observation_date}")

    # Healthy dense-canopy baseline: high NIR, moderate-low Red.
    base_nir = rng.normal(0.55, 0.05, size=(GRID_SIZE, GRID_SIZE)).clip(0.05, 0.95)
    base_red = rng.normal(0.09, 0.02, size=(GRID_SIZE, GRID_SIZE)).clip(0.01, 0.6)

    if clearing_severity > 0:
        # carve a contiguous "clearing" patch near the centre of the tile
        cy, cx = GRID_SIZE // 2 + rng.integers(-6, 6), GRID_SIZE // 2 + rng.integers(-6, 6)
        yy, xx = np.ogrid[:GRID_SIZE, :GRID_SIZE]
        radius = 6 + clearing_severity * 8
        mask = (yy - cy) ** 2 + (xx - cx) ** 2 <= radius**2
        base_nir[mask] -= clearing_severity * 0.42
        base_red[mask] += clearing_severity * 0.28
        base_nir = base_nir.clip(0.02, 0.95)
        base_red = base_red.clip(0.01, 0.9)

    return {"B04": base_red.astype(np.float32), "B08": base_nir.astype(np.float32)}
