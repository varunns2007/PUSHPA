from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.database.store import ALERTS, FOREST_ZONES
from app.police.stations import STATIONS, nearest_stations, stations_for_zone

router = APIRouter(prefix="/api/police-stations", tags=["police"])


@router.get("")
def list_stations(zone_id: str | None = None):
    """All registered stations, or just the ones assigned to a zone."""
    if zone_id:
        if zone_id not in {z["id"] for z in FOREST_ZONES}:
            raise HTTPException(404, "Zone not found")
        return {"stations": stations_for_zone(zone_id)}
    return {"stations": STATIONS}


@router.get("/nearby")
def nearby(
    lat: float = Query(..., description="Latitude of the incident/point"),
    lng: float = Query(..., description="Longitude of the incident/point"),
    limit: int = Query(3, ge=1, le=10),
    max_km: float | None = Query(None, description="Optional cap on search radius, km"),
):
    """Nearest stations to an arbitrary point — same lookup the alert
    pipeline uses internally to decide who gets notified."""
    return {"stations": nearest_stations(lat, lng, limit=limit, max_km=max_km)}


@router.get("/dispatch-log")
def dispatch_log(limit: int = Query(50, ge=1, le=200)):
    """Every alert that carried a police notification, most recent first —
    the audit trail proving detection actually reached a jurisdiction,
    not just the dashboard."""
    out = [
        {
            "alert_id": a["alert_id"],
            "created_at": a["created_at"],
            "rating": a.get("rating"),
            "kind": a.get("kind", "vehicle_risk"),
            "notified_stations": a.get("notified_stations", []),
        }
        for a in ALERTS
        if a.get("notified_stations")
    ]
    return {"dispatches": out[:limit]}
