from __future__ import annotations

import random
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.database.store import CHANGE_POLYGONS, VEHICLES
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


@router.post("/{vehicle_id}/simulate-tick")
def simulate_tick(vehicle_id: str):
    """Nudge a vehicle's position/speed slightly — lets the frontend demo a
    'live' telemetry feed without a real GPS integration."""
    v = VEHICLES.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    v["lat"] = round(v["lat"] + random.uniform(-0.003, 0.003), 6)
    v["lng"] = round(v["lng"] + random.uniform(-0.003, 0.003), 6)
    v["speed_kmh"] = max(0, round(v["speed_kmh"] + random.uniform(-8, 8)))
    v["heading_deg"] = round((v["heading_deg"] + random.uniform(-15, 15)) % 360)
    v["last_update"] = datetime.utcnow().isoformat()
    return {**v, "analysis": analyze_vehicle(v, list(CHANGE_POLYGONS.values()))}
