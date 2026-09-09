from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database.store import FOREST_ZONES
from app.geospatial.density_analyzer import analyze_density
from app.satellite.ndvi import compute_ndvi
from app.satellite.sentinel_client import fetch_bands

router = APIRouter(prefix="/api/satellite", tags=["satellite"])


def _zone_or_404(zone_id: str) -> dict:
    zone = next((z for z in FOREST_ZONES if z["id"] == zone_id), None)
    if not zone:
        raise HTTPException(404, "Zone not found")
    return zone


@router.get("/ndvi")
def get_ndvi(zone_id: str, date: str = "2026-06-01", severity: float = 0.0):
    """Query synthetic Sentinel-2 Level-2A bands for a zone/date and return
    the computed NDVI density analysis. `severity` (0-1) simulates injecting
    a canopy-loss event into the tile for demo purposes."""
    _zone_or_404(zone_id)
    bands = fetch_bands(zone_id, date, clearing_severity=severity)
    ndvi = compute_ndvi(bands["B04"], bands["B08"])
    analysis = analyze_density(ndvi)
    return {"zone_id": zone_id, "observation_date": date, **analysis}


@router.get("/compare")
def compare(zone_id: str, before_date: str = "2026-01-01", after_date: str = "2026-06-01", severity: float = 0.55):
    """Convenience endpoint returning both before/after NDVI summaries in
    one call, used by the frontend's Satellite Analysis page."""
    _zone_or_404(zone_id)
    before_bands = fetch_bands(zone_id, before_date, clearing_severity=0.0)
    after_bands = fetch_bands(zone_id, after_date, clearing_severity=severity)
    before_ndvi = compute_ndvi(before_bands["B04"], before_bands["B08"])
    after_ndvi = compute_ndvi(after_bands["B04"], after_bands["B08"])
    return {
        "zone_id": zone_id,
        "before": {"date": before_date, **analyze_density(before_ndvi)},
        "after": {"date": after_date, **analyze_density(after_ndvi)},
    }
