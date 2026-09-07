from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.database.db import db
from app.database.models import TimberPermit

router = APIRouter(prefix="/permits", tags=["Timber Permits"])

@router.get("", response_model=List[TimberPermit])
def get_permits():
    return list(db.permits.values())

@router.get("/{permit_id}", response_model=TimberPermit)
def get_permit(permit_id: str):
    if permit_id not in db.permits:
        raise HTTPException(status_code=404, detail="Timber permit not found")
    return db.permits[permit_id]
