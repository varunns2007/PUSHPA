from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.alerts.stream import raise_alert
from app.database.store import CHANGE_POLYGONS, VEHICLES
from app.risk.engine import compute_risk

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("")
def list_risk():
    polygons = list(CHANGE_POLYGONS.values())
    return {"results": [compute_risk(v, polygons) for v in VEHICLES.values()]}


@router.get("/{vehicle_id}")
def get_risk(vehicle_id: str, dispatch_alert: bool = False):
    v = VEHICLES.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    result = compute_risk(v, list(CHANGE_POLYGONS.values()))
    if dispatch_alert and result["rating"] in ("HIGH", "CRITICAL"):
        raise_alert(result)
    return result
