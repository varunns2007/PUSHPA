from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database.store import TIMBER_PERMITS
from app.permits.registry import verify_permit

router = APIRouter(prefix="/api/permits", tags=["permits"])


@router.get("")
def list_permits():
    return {"permits": [verify_permit(vid) for vid in TIMBER_PERMITS]}


@router.get("/{vehicle_id}")
def get_permit(vehicle_id: str):
    if vehicle_id not in TIMBER_PERMITS:
        raise HTTPException(404, "No record for this registration number")
    return verify_permit(vehicle_id)
