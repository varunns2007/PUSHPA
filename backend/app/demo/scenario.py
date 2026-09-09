from __future__ import annotations

from typing import Any

from app.alerts.stream import raise_alert
from app.database.store import CHANGE_POLYGONS, FOREST_ZONES, VEHICLES
from app.geospatial.change_detector import compute_delta, severe_loss_mask
from app.geospatial.density_analyzer import analyze_density
from app.geospatial.polygon_extractor import extract_polygons
from app.permits.registry import verify_permit
from app.risk.engine import _count_nearby_incidents
from app.risk.engine import compute_risk
from app.satellite.ndvi import compute_ndvi
from app.satellite.sentinel_client import fetch_bands
from app.vehicles.tracker import analyze_vehicle, haversine_km

ZONE_ID = "ZONE-A"
VEHICLE_ID = "TN01AB1234"
BEFORE_DATE = "2026-01-05"
AFTER_DATE = "2026-06-04"
SEVERITY = 0.62  # tuned so the demo lands close to the ~59% drop in the narrative


def run_scenario() -> dict[str, Any]:
    zone = next(z for z in FOREST_ZONES if z["id"] == ZONE_ID)
    steps: list[dict[str, Any]] = []

    # Step 1 — query satellite observation
    before_bands = fetch_bands(ZONE_ID, BEFORE_DATE, clearing_severity=0.0)
    after_bands = fetch_bands(ZONE_ID, AFTER_DATE, clearing_severity=SEVERITY)
    steps.append({
        "step": 1,
        "title": "Query Copernicus Sentinel-2 observation",
        "detail": f"Retrieved Level-2A tiles for {zone['name']} on {BEFORE_DATE} and {AFTER_DATE}.",
        "data": {"zone": zone, "before_date": BEFORE_DATE, "after_date": AFTER_DATE},
    })

    # Step 2 — NDVI calculation
    ndvi_before = compute_ndvi(before_bands["B04"], before_bands["B08"])
    ndvi_after = compute_ndvi(after_bands["B04"], after_bands["B08"])
    density_before = analyze_density(ndvi_before)
    density_after = analyze_density(ndvi_after)
    steps.append({
        "step": 2,
        "title": "Calculate Vegetation Density Index",
        "detail": f"Mean NDVI moved from {density_before['mean_ndvi']} to {density_after['mean_ndvi']}.",
        "data": {"before": density_before, "after": density_after},
    })

    # Step 3/4 — vectorize the change polygon first, since the flagship
    # clearing's own before/after means are the headline figures the rest
    # of the narrative refers to (the whole-tile mean is a much gentler
    # number and would understate a small, severe clearing).
    delta = compute_delta(ndvi_before, ndvi_after)
    mask = severe_loss_mask(delta)
    polygons = extract_polygons(mask, ndvi_before, ndvi_after, zone["center"], ZONE_ID)
    flagship = polygons[0] if polygons else None
    if flagship:
        flagship = {**flagship, "polygon_id": "CHG_POLY_001"}
        CHANGE_POLYGONS["CHG_POLY_001"] = flagship

    drop_pct = flagship["vegetation_drop_pct"] if flagship else 0.0
    steps.append({
        "step": 3,
        "title": "Before vs. after NDVI comparison",
        "detail": f"Detected a {drop_pct}% vegetation drop in the affected tile."
                  if flagship else "No significant localized drop detected this run.",
        "data": {"vegetation_drop_pct": drop_pct, "tile_mean_before": density_before["mean_ndvi"], "tile_mean_after": density_after["mean_ndvi"]},
    })

    steps.append({
        "step": 4,
        "title": "Vectorizer extracts change polygon",
        "detail": f"{flagship['polygon_id']} — {flagship['area_ha']} ha clearing identified."
                  if flagship else "No polygon met the minimum-size threshold this run.",
        "data": {"polygon": flagship, "all_polygons": polygons},
    })

    # Step 5 — vehicle telemetry proximity
    vehicle = VEHICLES[VEHICLE_ID]
    vehicle_analysis = analyze_vehicle(vehicle, [flagship] if flagship else [])
    distance_km = vehicle_analysis["distance_to_change_km"]
    steps.append({
        "step": 5,
        "title": "Telemetry tracks vehicle near the clear-cut zone",
        "detail": f"Vehicle {VEHICLE_ID} is travelling {distance_km}km from the clearing." if distance_km is not None
                  else f"Vehicle {VEHICLE_ID} telemetry received; no nearby clearing on file.",
        "data": {"vehicle": vehicle, "analysis": vehicle_analysis},
    })

    # Step 6 — route anomaly
    steps.append({
        "step": 6,
        "title": "Route engine flags interior track deviation",
        "detail": "OFF_ROUTE_TRANSIT — vehicle is heading along an unmonitored interior dirt track."
                  if "OFF_ROUTE_TRANSIT" in vehicle_analysis["flags"]
                  else "Vehicle route is consistent with a recognized transit corridor.",
        "data": {"flags": vehicle_analysis["flags"], "distance_to_legal_corridor_km": vehicle_analysis["distance_to_legal_corridor_km"]},
    })

    # Step 7 — permit verification
    permit = verify_permit(VEHICLE_ID, vehicle.get("declared_species"), vehicle.get("cargo_weight_kg"))
    steps.append({
        "step": 7,
        "title": "Permit engine checks the digital registry",
        "detail": "NO VALID PERMIT FOUND." if not permit["valid"] else f"Permit {permit['permit_id']} verified valid.",
        "data": permit,
    })

    # Step 8 — historical correlation
    incident_count = _count_nearby_incidents(vehicle["lat"], vehicle["lng"])
    steps.append({
        "step": 8,
        "title": "Correlate with historical illegal-logging incidents",
        "detail": f"{incident_count} prior incidents recorded within 3km of this location.",
        "data": {"incident_count": incident_count},
    })

    # Step 9 — explainable risk score
    risk_result = compute_risk(vehicle, [flagship] if flagship else [])
    steps.append({
        "step": 9,
        "title": "Explainable AI engine computes the investigation risk score",
        "detail": f"Risk score {risk_result['risk_score']}/100 — {risk_result['rating']}.",
        "data": risk_result,
    })

    # Step 10 — dispatch
    alert = None
    if risk_result["rating"] in ("HIGH", "CRITICAL"):
        alert = raise_alert(risk_result)
    steps.append({
        "step": 10,
        "title": "System triggers alert and opens the Officer Investigation Panel",
        "detail": f"{risk_result['rating']} ALERT dispatched for {VEHICLE_ID} — tactical ranger interception recommended."
                  if alert else "Risk score below the dispatch threshold; no alert raised.",
        "data": {"alert": alert},
    })

    return {
        "scenario": "Nilgiri Biosphere Reserve — Zone A smuggling interception",
        "zone_id": ZONE_ID,
        "vehicle_id": VEHICLE_ID,
        "steps": steps,
        "final_risk_score": risk_result["risk_score"],
        "final_rating": risk_result["rating"],
    }
