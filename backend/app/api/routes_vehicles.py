from __future__ import annotations

import random
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.alerts.stream import raise_convoy_alert
from app.database.store import CHANGE_POLYGONS, VEHICLE_POSITION_LOG, VEHICLES, log_vehicle_position
from app.vehicles.convoy_correlation import analyze_convoy_signatures
from app.vehicles.tracker import analyze_vehicle

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("")
def list_vehicles():
    polygons = list(CHANGE_POLYGONS.values())
    out = []
    for v in VEHICLES.values():
        out.append({**v, "analysis": analyze_vehicle(v, polygons)})
    return {"vehicles": out}


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str):
    v = VEHICLES.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    return {**v, "analysis": analyze_vehicle(v, list(CHANGE_POLYGONS.values()))}


@router.get("/{vehicle_id}/history")
def vehicle_history(vehicle_id: str):
    """Position log for a single vehicle — what the Google Maps live-track
    view polls to draw a trail, and what the Convoy Correlation Engine
    reads to spot repeat visits."""
    if vehicle_id not in VEHICLES:
        raise HTTPException(404, "Vehicle not found")
    return {"vehicle_id": vehicle_id, "history": VEHICLE_POSITION_LOG.get(vehicle_id, [])}


@router.post("/{vehicle_id}/simulate-tick")
def simulate_tick(vehicle_id: str):
    """Nudge a vehicle's position/speed slightly — lets the frontend demo a
    'live' telemetry feed without a real GPS integration. Every tick is
    logged to VEHICLE_POSITION_LOG, and the Convoy Correlation Engine is
    re-run immediately so a HIGH/CRITICAL multi-vehicle pattern shows up
    in the live alert stream the instant it emerges, not on the next
    scheduled satellite watch."""
    v = VEHICLES.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    v["lat"] = round(v["lat"] + random.uniform(-0.003, 0.003), 6)
    v["lng"] = round(v["lng"] + random.uniform(-0.003, 0.003), 6)
    v["speed_kmh"] = max(0, round(v["speed_kmh"] + random.uniform(-8, 8)))
    v["heading_deg"] = round((v["heading_deg"] + random.uniform(-15, 15)) % 360)
    v["last_update"] = datetime.utcnow().isoformat()
    log_vehicle_position(vehicle_id, v["lat"], v["lng"], v["last_update"])

    for signature in analyze_convoy_signatures(list(CHANGE_POLYGONS.values()), VEHICLE_POSITION_LOG):
        if signature["rating"] in ("HIGH", "CRITICAL"):
            raise_convoy_alert(signature)

    return {**v, "analysis": analyze_vehicle(v, list(CHANGE_POLYGONS.values()))}
