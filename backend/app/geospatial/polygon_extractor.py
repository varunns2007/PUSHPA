from __future__ import annotations

from typing import Any

import numpy as np
from scipy import ndimage

from app.database.store import next_id

# Each synthetic tile represents roughly a 2km x 2km ground footprint at
# GRID_SIZE resolution (matches app/satellite/sentinel_client.py).
TILE_SPAN_M = 2000.0


def extract_polygons(
    mask: np.ndarray,
    ndvi_before: np.ndarray,
    ndvi_after: np.ndarray,
    zone_center: dict[str, float],
    zone_id: str,
    min_pixels: int = 3,
) -> list[dict[str, Any]]:
    """Label contiguous True regions in `mask` and describe each as a
    geo-referenced "polygon" (in the demo, an approximate centroid + area +
    perimeter rather than a full vector boundary — sufficient to drive the
    Change Detection table and map markers without an OpenCV/GEOS dependency)."""
    labeled, n = ndimage.label(mask, structure=np.ones((3, 3)))
    grid = mask.shape[0]
    pixel_size_m = TILE_SPAN_M / grid
    pixel_area_ha = (pixel_size_m**2) / 10_000

    results: list[dict[str, Any]] = []
    for label_id in range(1, n + 1):
        region = labeled == label_id
        count = int(region.sum())
        if count < min_pixels:
            continue

        ys, xs = np.where(region)
        centroid_y, centroid_x = float(ys.mean()), float(xs.mean())

        # convert pixel centroid -> approximate lat/lng offset around zone center
        dy_m = (centroid_y - grid / 2) * pixel_size_m
        dx_m = (centroid_x - grid / 2) * pixel_size_m
        d_lat = -(dy_m / 111_320)
        d_lng = dx_m / (111_320 * np.cos(np.radians(zone_center["lat"])))

        # perimeter: count region-boundary edges (4-connectivity)
        perimeter_px = _boundary_edge_count(region)
        perimeter_m = perimeter_px * pixel_size_m

        before_mean = float(ndvi_before[region].mean())
        after_mean = float(ndvi_after[region].mean())
        drop_pct = round((1 - after_mean / before_mean) * 100, 1) if before_mean > 0 else 0.0
        area_ha = round(count * pixel_area_ha, 2)

        severity = (
            "CRITICAL" if drop_pct >= 60 else
            "SEVERE" if drop_pct >= 40 else
            "MODERATE" if drop_pct >= 20 else
            "MINOR"
        )

        results.append({
            "polygon_id": next_id("CHG_POLY"),
            "zone_id": zone_id,
            "centroid": {"lat": round(zone_center["lat"] + d_lat, 5), "lng": round(zone_center["lng"] + d_lng, 5)},
            "area_ha": area_ha,
            "perimeter_m": round(float(perimeter_m), 1),
            "ndvi_before_mean": round(before_mean, 3),
            "ndvi_after_mean": round(after_mean, 3),
            "vegetation_drop_pct": drop_pct,
            "severity": severity,
            "pixel_count": count,
        })

    results.sort(key=lambda r: r["area_ha"], reverse=True)
    return results


def _boundary_edge_count(region: np.ndarray) -> int:
    padded = np.pad(region, 1, mode="constant", constant_values=False)
    edges = 0
    edges += np.logical_and(padded[1:-1, 1:-1], ~padded[:-2, 1:-1]).sum()  # up
    edges += np.logical_and(padded[1:-1, 1:-1], ~padded[2:, 1:-1]).sum()   # down
    edges += np.logical_and(padded[1:-1, 1:-1], ~padded[1:-1, :-2]).sum()  # left
    edges += np.logical_and(padded[1:-1, 1:-1], ~padded[1:-1, 2:]).sum()   # right
    return int(edges)
