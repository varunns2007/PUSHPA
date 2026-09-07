from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database.db import db
from app.vehicles.tracker import vehicle_tracker

router = APIRouter(prefix="/routes", tags=["Routes"])

class RouteAnalysisRequest(BaseModel):
    vehicle_id: str

@router.post("/analyze")
def analyze_route(req: RouteAnalysisRequest):
    if req.vehicle_id not in db.vehicles:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicle = db.vehicles[req.vehicle_id]
    polygons = list(db.polygons.values())
    permit = db.permits.get(vehicle.permit_id) if vehicle.permit_id else None
    
    result = vehicle_tracker.analyze_vehicle_route(
        vehicle=vehicle,
        change_polygons=polygons,
        permit=permit
    )
    return result
