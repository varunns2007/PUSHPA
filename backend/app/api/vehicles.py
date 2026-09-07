from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.database.db import db
from app.database.models import Vehicle
from app.vehicles.simulator import vehicle_simulator

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[Vehicle])
def get_vehicles():
    return list(db.vehicles.values())

@router.get("/{vehicle_id}", response_model=Vehicle)
def get_vehicle(vehicle_id: str):
    if vehicle_id not in db.vehicles:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db.vehicles[vehicle_id]

@router.post("/simulate", response_model=List[Vehicle])
def trigger_vehicle_simulation_step():
    vehicle_simulator.vehicles = db.vehicles
    updated = vehicle_simulator.step_simulation()
    for v in updated:
        db.vehicles[v.id] = v
    return updated
