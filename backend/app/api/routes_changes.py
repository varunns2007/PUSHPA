from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database.store import CHANGE_POLYGONS, FOREST_ZONES
from app.geospatial.change_detector import compute_delta, severe_loss_mask
from app.geospatial.polygon_extractor import extract_polygons
from app.satellite.ndvi import compute_ndvi
from app.satellite.sentinel_client import fetch_bands

router = APIRouter(prefix="/api/changes", tags=["changes"])


class DetectRequest(BaseModel):
    zone_id: str
    before_date: str = "2026-01-01"
    after_date: str = "2026-06-01"
    severity: float = 0.55  # 0-1, synthetic clearing intensity injected for the demo


@router.get("")
def list_changes():
    return {"polygons": list(CHANGE_POLYGONS.values())}


@router.get("/{polygon_id}")
def get_change(polygon_id: str):
    poly = CHANGE_POLYGONS.get(polygon_id)
    if not poly:
        raise HTTPException(404, "Polygon not found")
    return poly


@router.post("/detect")
def detect(req: DetectRequest):
    zone = next((z for z in FOREST_ZONES if z["id"] == req.zone_id), None)
    if not zone:
        raise HTTPException(404, "Zone not found")

    before_bands = fetch_bands(req.zone_id, req.before_date, clearing_severity=0.0)
    after_bands = fetch_bands(req.zone_id, req.after_date, clearing_severity=req.severity)
    ndvi_before = compute_ndvi(before_bands["B04"], before_bands["B08"])
    ndvi_after = compute_ndvi(after_bands["B04"], after_bands["B08"])

    delta = compute_delta(ndvi_before, ndvi_after)
    mask = severe_loss_mask(delta)
    polygons = extract_polygons(mask, ndvi_before, ndvi_after, zone["center"], req.zone_id)

    for poly in polygons:
        CHANGE_POLYGONS[poly["polygon_id"]] = poly

    return {
        "zone_id": req.zone_id,
        "before_date": req.before_date,
        "after_date": req.after_date,
        "mean_delta_ndvi": round(float(delta.mean()), 4),
        "polygons": polygons,
    }
