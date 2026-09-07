import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PUSHPA — Predictive Unified System for Forest Protection & Anti-Smuggling"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Credentials & API Keys
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    COPERNICUS_CLIENT_ID: str = os.getenv("COPERNICUS_CLIENT_ID", "")
    COPERNICUS_CLIENT_SECRET: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pushpa.db")
    
    # Thresholds
    NDVI_NON_VEG: float = 0.20
    NDVI_SPARSE: float = 0.40
    NDVI_MODERATE: float = 0.60
    
    # Change Detection Thresholds
    CHANGE_LOW: float = -0.15
    CHANGE_MODERATE: float = -0.25
    CHANGE_HIGH: float = -0.35
    CHANGE_CRITICAL: float = -0.50
    
    # Simulation
    SIMULATION_MODE: bool = True
    SIMULATION_INTERVAL_SEC: int = 3

settings = Settings()
