from __future__ import annotations

from typing import Any

from app.database.store import HISTORICAL_INCIDENTS
from app.permits.registry import verify_permit
from app.vehicles.tracker import analyze_vehicle

HOTSPOT_INCIDENT_THRESHOLD = 5
HOTSPOT_RADIUS_KM = 3.0


def _count_nearby_incidents(lat: float, lng: float) -> int:
    from app.vehicles.tracker import haversine_km

    return sum(
        1 for inc in HISTORICAL_INCIDENTS
        if haversine_km(lat, lng, inc["lat"], inc["lng"]) <= HOTSPOT_RADIUS_KM
    )


def compute_risk(
    vehicle: dict[str, Any],
    change_polygons: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Weighted, explainable risk score per the PUSHPA specification:

      Change Severity        +30   canopy loss > 50% in a nearby tile
      Permit Violation       +25   unpermitted / expired / species mismatch
      Spatial Proximity      +20   vehicle within 3.0km of a fresh clearing
      Route Anomaly          +15   deviating into restricted interior tracks
      Historical Hotspot     +10   zone has > 5 previous felling records

    Score is capped at 100 and always returned with a transparent
    per-factor breakdown so a field officer can see exactly why a vehicle
    or zone was flagged.
    """
    breakdown: list[dict[str, Any]] = []
    score = 0

    vehicle_analysis = analyze_vehicle(vehicle, change_polygons)
    permit = verify_permit(vehicle["vehicle_id"], vehicle.get("declared_species"), vehicle.get("cargo_weight_kg"))

    nearest_polygon = next(
        (p for p in change_polygons if p["polygon_id"] == vehicle_analysis["nearest_change_polygon"]), None
    )

    # 1. Change severity
    change_pts = 0
    if nearest_polygon and nearest_polygon.get("vegetation_drop_pct", 0) > 50:
        change_pts = 30
    score += change_pts
    breakdown.append({
        "factor": "Change Severity",
        "points": change_pts,
        "max_points": 30,
        "triggered": change_pts > 0,
        "detail": f"Nearest tile shows {nearest_polygon['vegetation_drop_pct']}% canopy loss."
                  if nearest_polygon else "No significant canopy loss detected nearby.",
    })

    # 2. Permit violation
    permit_pts = 25 if not permit["valid"] else 0
    score += permit_pts
    breakdown.append({
        "factor": "Permit Violation",
        "points": permit_pts,
        "max_points": 25,
        "triggered": permit_pts > 0,
        "detail": permit["reason"],
    })

    # 3. Spatial proximity
    proximity_pts = 0
    if vehicle_analysis["distance_to_change_km"] is not None and vehicle_analysis["distance_to_change_km"] < 3.0:
        proximity_pts = 20
    score += proximity_pts
    breakdown.append({
        "factor": "Spatial Proximity",
        "points": proximity_pts,
        "max_points": 20,
        "triggered": proximity_pts > 0,
        "detail": f"Vehicle is {vehicle_analysis['distance_to_change_km']}km from the nearest change polygon."
                  if vehicle_analysis["distance_to_change_km"] is not None else "No change polygons in range.",
    })

    # 4. Route anomaly
    route_pts = 15 if "OFF_ROUTE_TRANSIT" in vehicle_analysis["flags"] else 0
    score += route_pts
    breakdown.append({
        "factor": "Route Anomaly",
        "points": route_pts,
        "max_points": 15,
        "triggered": route_pts > 0,
        "detail": f"{vehicle_analysis['distance_to_legal_corridor_km']}km from the nearest legal transit corridor."
                  if route_pts > 0 else "Vehicle is travelling a recognized transit corridor.",
    })

    # 5. Historical hotspot
    incident_count = _count_nearby_incidents(vehicle["lat"], vehicle["lng"])
    hotspot_pts = 10 if incident_count > HOTSPOT_INCIDENT_THRESHOLD else 0
    score += hotspot_pts
    breakdown.append({
        "factor": "Historical Hotspot",
        "points": hotspot_pts,
        "max_points": 10,
        "triggered": hotspot_pts > 0,
        "detail": f"{incident_count} prior illegal-felling incidents recorded within {HOTSPOT_RADIUS_KM}km.",
    })

    score = min(100, score)
    rating = (
        "CRITICAL" if score >= 80 else
        "HIGH" if score >= 60 else
        "MODERATE" if score >= 35 else
        "LOW"
    )

    return {
        "vehicle_id": vehicle["vehicle_id"],
        "risk_score": score,
        "rating": rating,
        "breakdown": breakdown,
        "vehicle_analysis": vehicle_analysis,
        "permit": permit,
        "nearest_polygon": nearest_polygon,
    }
