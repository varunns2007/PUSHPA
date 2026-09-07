from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.database.db import db
from app.database.models import Alert

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[Alert])
def get_alerts():
    return db.alerts

@router.put("/{alert_id}/status")
def update_alert_status(alert_id: str, status: str):
    for a in db.alerts:
        if a.id == alert_id:
            a.investigation_status = status
            return a
    raise HTTPException(status_code=404, detail="Alert not found")
