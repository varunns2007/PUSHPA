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

ZONE_ID = "ZONE-B"
VEHICLE_ID = "TN 38 BX 9104"
BEFORE_DATE = "2026-01-05"
AFTER_DATE = "2026-06-04"
SEVERITY = 0.62  # tuned to match the ~61% drop in the Anamalai Sector 3 narrative


def run_scenario() -> dict[str, Any]:
    zone = next(z for z in FOREST_ZONES if z["id"] == ZONE_ID)
    steps: list[dict[str, Any]] = []

    # Step 1 — query satellite observation
    before_bands = fetch_bands(ZONE_ID, BEFORE_DATE, clearing_severity=0.0)
    after_bands = fetch_bands(ZONE_ID, AFTER_DATE, clearing_severity=SEVERITY)
    steps.append({
        "step": 1,
        "title": "Query Copernicus Sentinel-2 MSI Observation",
        "detail": f"Retrieved Level-2A multi-spectral tiles for {zone['name']} (Granules S2A_20260105 and S2B_20260604).",
        "data": {"zone": zone, "before_date": BEFORE_DATE, "after_date": AFTER_DATE},
    })

    # Step 2 — NDVI calculation
    ndvi_before = compute_ndvi(before_bands["B04"], before_bands["B08"])
    ndvi_after = compute_ndvi(after_bands["B04"], after_bands["B08"])
    density_before = analyze_density(ndvi_before)
    density_after = analyze_density(ndvi_after)
    steps.append({
        "step": 2,
        "title": "Calculate Normalized Difference Vegetation Index (NDVI)",
        "detail": f"Mean NDVI moved from {density_before['mean_ndvi']} to {density_after['mean_ndvi']} in Sector 3.",
        "data": {"before": density_before, "after": density_after},
    })

    # Step 3/4 — vectorize change polygon
    delta = compute_delta(ndvi_before, ndvi_after)
    mask = severe_loss_mask(delta)
    polygons = extract_polygons(mask, ndvi_before, ndvi_after, zone["center"], ZONE_ID)
    flagship = polygons[0] if polygons else None
    if flagship:
        flagship = {**flagship, "polygon_id": "CHG_POLY_001", "valuable_species": "Red Sanders (Pterocarpus santalinus)"}
        CHANGE_POLYGONS["CHG_POLY_001"] = flagship

    drop_pct = flagship["vegetation_drop_pct"] if flagship else 0.0
    steps.append({
        "step": 3,
        "title": "Before vs. After Spectral Comparison",
        "detail": f"Detected a {drop_pct}% vegetation drop in Sholayar River Basin Sector 3."
                  if flagship else "No significant localized drop detected this run.",
        "data": {"vegetation_drop_pct": drop_pct, "tile_mean_before": density_before["mean_ndvi"], "tile_mean_after": density_after["mean_ndvi"]},
    })

    steps.append({
        "step": 4,
        "title": "Vectorizer extracts illegal clearing polygon",
        "detail": f"{flagship['polygon_id']} — {flagship['area_ha']} ha Red Sanders extraction zone delineated."
                  if flagship else "No polygon met the minimum-size threshold this run.",
        "data": {"polygon": flagship, "all_polygons": polygons},
    })

    # Step 5 — vehicle telemetry proximity
    vehicle = VEHICLES[VEHICLE_ID]
    vehicle_analysis = analyze_vehicle(vehicle, [flagship] if flagship else [])
    distance_km = vehicle_analysis["distance_to_change_km"]
    steps.append({
        "step": 5,
        "title": "GPS Telemetry tracks vehicle near clear-cut zone",
        "detail": f"Vehicle {VEHICLE_ID} ({vehicle['make_model']}) is stationary {distance_km}km from the clearing." if distance_km is not None
                  else f"Vehicle {VEHICLE_ID} telemetry received; no nearby clearing on file.",
        "data": {"vehicle": vehicle, "analysis": vehicle_analysis},
    })

    # Step 6 — route anomaly
    steps.append({
        "step": 6,
        "title": "Route Engine flags interior reserve trail deviation",
        "detail": "OFF_ROUTE_TRANSIT — vehicle is stationary on an unpaved Sholayar tributary interior track."
                  if "OFF_ROUTE_TRANSIT" in vehicle_analysis["flags"]
                  else "Vehicle route is consistent with recognized highway corridor.",
        "data": {"flags": vehicle_analysis["flags"], "distance_to_legal_corridor_km": vehicle_analysis["distance_to_legal_corridor_km"]},
    })

    # Step 7 — permit verification
    permit = verify_permit(VEHICLE_ID, vehicle.get("declared_species"), vehicle.get("cargo_weight_kg"))
    steps.append({
        "step": 7,
        "title": "Permit Engine queries TN Forest E-Permit Registry",
        "detail": "NO VALID PERMIT FOUND — zero Form II/IV transit passes on record for registration TN 38 BX 9104." if not permit["valid"] else f"Permit {permit['permit_id']} verified valid.",
        "data": permit,
    })

    # Step 8 — historical correlation
    incident_count = _count_nearby_incidents(vehicle["lat"], vehicle["lng"])
    steps.append({
        "step": 8,
        "title": "Correlate with historical illegal logging incident records",
        "detail": f"{incident_count} prior illegal logging seizures recorded within 3km of this sector.",
        "data": {"incident_count": incident_count},
    })

    # Step 9 — explainable risk score
    risk_result = compute_risk(vehicle, [flagship] if flagship else [])
    steps.append({
        "step": 9,
        "title": "Explainable Risk Engine computes multi-factor score",
        "detail": f"Investigation Risk Score: {risk_result['risk_score']}/100 — {risk_result['rating']}.",
        "data": risk_result,
    })

    # Step 10 — dispatch to real police stations
    alert = None
    if risk_result["rating"] in ("HIGH", "CRITICAL"):
        alert = raise_alert(risk_result)
    steps.append({
        "step": 10,
        "title": "Automated dispatch to nearest Police Stations & ATR Range Office",
        "detail": f"{risk_result['rating']} ALERT dispatched for {VEHICLE_ID} — Notified Valparai PS, Sholayar Dam PS & Topslip ATR Strike Force."
                  if alert else "Risk score below dispatch threshold; monitoring logged.",
        "data": {"alert": alert},
    })

    return {
        "scenario": "Anamalai Tiger Reserve — Red Sanders Smuggling Interception",
        "zone_id": ZONE_ID,
        "vehicle_id": VEHICLE_ID,
        "steps": steps,
        "final_risk_score": risk_result["risk_score"],
        "final_rating": risk_result["rating"],
    }
