from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.database.db import db
from app.database.models import HistoricalIncident

router = APIRouter(prefix="/incidents", tags=["Historical Incidents"])

@router.get("", response_model=List[HistoricalIncident])
def get_incidents(forest_id: Optional[str] = None):
    incidents = list(db.incidents.values())
    if forest_id:
        incidents = [i for i in incidents if i.forest_area_id == forest_id]
    return incidents
