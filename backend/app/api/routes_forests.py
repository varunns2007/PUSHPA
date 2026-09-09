from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database.store import FOREST_ZONES

router = APIRouter(prefix="/api/forests", tags=["forests"])


@router.get("")
def list_zones():
    return {"zones": FOREST_ZONES}


@router.get("/{zone_id}")
def get_zone(zone_id: str):
    zone = next((z for z in FOREST_ZONES if z["id"] == zone_id), None)
    if not zone:
        raise HTTPException(404, "Zone not found")
    return zone
