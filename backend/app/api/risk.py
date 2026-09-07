from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database.db import db
from app.database.models import RiskScoreBreakdown
from app.risk.engine import risk_engine

router = APIRouter(prefix="/risk", tags=["Risk Engine"])

class RiskCalculationRequest(BaseModel):
    forest_id: str
    change_event_id: Optional[str] = None
    vehicle_id: Optional[str] = None

@router.post("/calculate", response_model=RiskScoreBreakdown)
def calculate_risk_score(req: RiskCalculationRequest):
    if req.forest_id not in db.forests:
        raise HTTPException(status_code=404, detail="Forest not found")
    
    forest = db.forests[req.forest_id]
    change = db.changes.get(req.change_event_id) if req.change_event_id else None
    if not change:
        # Find latest change event for forest
        forest_changes = [c for c in db.changes.values() if c.forest_id == req.forest_id]
        if forest_changes:
            change = forest_changes[-1]

    vehicle = db.vehicles.get(req.vehicle_id) if req.vehicle_id else None
    if not vehicle:
        # Find suspicious vehicle near forest
        for v in db.vehicles.values():
            if v.permit_status != "VALID":
                vehicle = v
                break

    permit = db.permits.get(vehicle.permit_id) if (vehicle and vehicle.permit_id) else None
    incidents = [i for i in db.incidents.values() if i.forest_area_id == req.forest_id]

    breakdown = risk_engine.calculate_risk(
        change_event=change,
        vehicle=vehicle,
        permit=permit,
        nearby_incidents=incidents,
        distance_km=2.3
    )
    return breakdown
