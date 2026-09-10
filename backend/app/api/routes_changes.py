from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import math

from app.database.store import CHANGE_POLYGONS, FOREST_ZONES, HISTORICAL_INCIDENTS
from app.explain.plain_language import explain_change
from app.geospatial.change_detector import compute_delta, severe_loss_mask
from app.geospatial.density_analyzer import analyze_density
from app.geospatial.polygon_extractor import extract_polygons
from app.satellite.ndvi import compute_ndvi
from app.satellite.sentinel_client import fetch_bands_for_zone

router = APIRouter(prefix="/api/changes", tags=["changes"])


class DetectRequest(BaseModel):
    zone_id: str
    before_date: str = "2026-01-01"
    after_date: str = "2026-06-01"
    severity: float = 0.55  # 0-1, synthetic clearing intensity injected for the demo (ignored in live mode)


def _nearby_valuable_species(polygons: list[dict], zone_id: str, radius_km: float = 1.0) -> str | None:
    """If a cleared polygon sits near a spot with a history of high-value
    species felling (Rosewood, Teak, Red Sanders), surface that species —
    it's the difference between "some trees fell" and "someone specifically
    came back for the valuable timber again"."""
    severe = [p for p in polygons if p.get("severity") in ("CRITICAL", "SEVERE")]
    incidents = [i for i in HISTORICAL_INCIDENTS if i["zone_id"] == zone_id]
    for poly in severe:
        for inc in incidents:
            dlat = (poly["centroid"]["lat"] - inc["lat"]) * 111.32
            dlng = (poly["centroid"]["lng"] - inc["lng"]) * 111.32 * math.cos(math.radians(inc["lat"]))
            if math.hypot(dlat, dlng) <= radius_km:
                return inc["species"]
    return None


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

    before_bands, before_meta = fetch_bands_for_zone(zone, req.before_date, clearing_severity=0.0)
    after_bands, after_meta = fetch_bands_for_zone(zone, req.after_date, clearing_severity=req.severity)
    ndvi_before = compute_ndvi(before_bands["B04"], before_bands["B08"])
    ndvi_after = compute_ndvi(after_bands["B04"], after_bands["B08"])

    delta = compute_delta(ndvi_before, ndvi_after)
    mask = severe_loss_mask(delta)
    polygons = extract_polygons(mask, ndvi_before, ndvi_after, zone["center"], req.zone_id)

    for poly in polygons:
        CHANGE_POLYGONS[poly["polygon_id"]] = poly

    total_area_lost_ha = round(sum(p["area_ha"] for p in polygons), 2)
    # Cross-reference cleared polygons against historically-logged valuable-
    # species felling sites nearby, so the plain-language layer can flag
    # "this looks like timber theft" rather than generic tree loss.
    valuable_species = _nearby_valuable_species(polygons, req.zone_id)
    before_analysis = analyze_density(ndvi_before)
    after_analysis = analyze_density(ndvi_after)

    plain = explain_change(
        zone_name=zone["name"],
        before_date=before_meta["observation_date_actual"],
        after_date=after_meta["observation_date_actual"],
        density_before_pct=before_analysis["canopy_density_pct"],
        density_after_pct=after_analysis["canopy_density_pct"],
        area_lost_ha=total_area_lost_ha,
        valuable_species_lost=valuable_species,
        data_source=after_meta["source"],
        cloud_cover_note=(
            f"cloud cover on captured scene: {after_meta['cloud_cover_pct']}%"
            if after_meta.get("cloud_cover_pct") is not None
            else None
        ),
    )

    return {
        "zone_id": req.zone_id,
        "before_date": req.before_date,
        "after_date": req.after_date,
        "mean_delta_ndvi": round(float(delta.mean()), 4),
        "polygons": polygons,
        "total_area_lost_ha": total_area_lost_ha,
        "before_source": before_meta,
        "after_source": after_meta,
        "plain_language": plain,
    }
