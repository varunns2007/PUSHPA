from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database.store import FOREST_ZONES
from app.explain.plain_language import explain_change, explain_snapshot
from app.geospatial.change_detector import compute_delta, severe_loss_mask
from app.geospatial.density_analyzer import analyze_density
from app.geospatial.polygon_extractor import extract_polygons
from app.satellite.ndvi import compute_ndvi
from app.satellite.sentinel_client import fetch_bands_for_zone

router = APIRouter(prefix="/api/satellite", tags=["satellite"])


def _zone_or_404(zone_id: str) -> dict:
    zone = next((z for z in FOREST_ZONES if z["id"] == zone_id), None)
    if not zone:
        raise HTTPException(404, "Zone not found")
    return zone


@router.get("/ndvi")
def get_ndvi(zone_id: str, date: str = "2026-06-01", severity: float = 0.0):
    """Query Sentinel-2 bands (real if USE_LIVE_SATELLITE=1, else synthetic
    demo data) for a zone/date and return the computed NDVI density
    analysis, plus a plain-language caption of what the image shows."""
    zone = _zone_or_404(zone_id)
    bands, meta = fetch_bands_for_zone(zone, date, clearing_severity=severity)
    ndvi = compute_ndvi(bands["B04"], bands["B08"])
    analysis = analyze_density(ndvi)
    plain = explain_snapshot(zone["name"], meta["observation_date_actual"], analysis["canopy_density_pct"], meta["source"])
    return {"zone_id": zone_id, "observation_date": date, **analysis, "source": meta, "plain_language": plain}


@router.get("/compare")
def compare(zone_id: str, before_date: str = "2026-01-01", after_date: str = "2026-06-01", severity: float = 0.55):
    """Before/after NDVI summary used by the frontend's Satellite Compare
    page, now including a plain-language explanation a non-technical
    reader can act on without knowing what NDVI means."""
    zone = _zone_or_404(zone_id)
    before_bands, before_meta = fetch_bands_for_zone(zone, before_date, clearing_severity=0.0)
    # severity only matters for the synthetic generator; live fetches ignore it
    after_bands, after_meta = fetch_bands_for_zone(zone, after_date, clearing_severity=severity)
    before_ndvi = compute_ndvi(before_bands["B04"], before_bands["B08"])
    after_ndvi = compute_ndvi(after_bands["B04"], after_bands["B08"])
    before_analysis = analyze_density(before_ndvi)
    after_analysis = analyze_density(after_ndvi)

    # Real hectare estimate, not a guess: same severe-loss-mask + polygon
    # extraction the full Change Detection pipeline uses, just summed here
    # rather than persisted.
    mask = severe_loss_mask(compute_delta(before_ndvi, after_ndvi))
    polygons = extract_polygons(mask, before_ndvi, after_ndvi, zone["center"], zone_id)
    area_lost_ha = round(sum(p["area_ha"] for p in polygons), 2)
    plain = explain_change(
        zone_name=zone["name"],
        before_date=before_meta["observation_date_actual"],
        after_date=after_meta["observation_date_actual"],
        density_before_pct=before_analysis["canopy_density_pct"],
        density_after_pct=after_analysis["canopy_density_pct"],
        area_lost_ha=area_lost_ha,
        data_source=after_meta["source"],
    )

    return {
        "zone_id": zone_id,
        "before": {"date": before_date, **before_analysis, "source": before_meta},
        "after": {"date": after_date, **after_analysis, "source": after_meta},
        "plain_language": plain,
    }
