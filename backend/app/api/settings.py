from fastapi import APIRouter
from app.database.db import db
from app.database.models import SystemSettings

router = APIRouter(prefix="/settings", tags=["System Settings"])

@router.get("", response_model=SystemSettings)
def get_settings():
    return db.system_settings

@router.post("", response_model=SystemSettings)
def update_settings(new_settings: SystemSettings):
    db.system_settings = new_settings
    return db.system_settings
