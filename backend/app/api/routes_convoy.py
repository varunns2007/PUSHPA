from __future__ import annotations

from fastapi import APIRouter

from app.database.store import CHANGE_POLYGONS, VEHICLE_POSITION_LOG
from app.vehicles.convoy_correlation import analyze_convoy_signatures

router = APIRouter(prefix="/api/convoy", tags=["convoy"])


@router.get("/signatures")
def signatures():
    """On-demand read of the Convoy Correlation Engine: which recent
    severe clearings have a multi-vehicle or repeat-visitor pattern around
    them right now. The scheduler/watch cycle and every simulate-tick also
    run this and push HIGH/CRITICAL results to the live alert stream —
    this endpoint is for the UI to render the full picture, including
    lower-rated signatures the stream doesn't push."""
    return {"signatures": analyze_convoy_signatures(list(CHANGE_POLYGONS.values()), VEHICLE_POSITION_LOG)}
