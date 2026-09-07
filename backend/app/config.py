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
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "pushpa_secure_jwt_secret_forest_defense_2026")
    
    # NDVI Thresholds
    NDVI_NON_VEG: float = 0.20
    NDVI_SPARSE: float = 0.40
    NDVI_MODERATE: float = 0.60
    
    # Change Detection Thresholds
    CHANGE_LOW: float = -0.15
    CHANGE_MODERATE: float = -0.25
    CHANGE_HIGH: float = -0.35
    CHANGE_CRITICAL: float = -0.50
    
    # Minimum Disturbance Area (Hectares)
    MIN_DISTURBANCE_AREA_HA: float = 0.05
    
    # Vehicle Spatial & Temporal Window Configuration
    VEHICLE_TEMPORAL_WINDOW_HOURS: int = 48
    VEHICLE_MAX_CORRELATION_DISTANCE_KM: float = 8.0
    
    # Alert Deduplication Window
    ALERT_DEDUP_DISTANCE_KM: float = 1.0
    ALERT_DEDUP_TIME_HOURS: int = 72
    
    # Historical Incident Decay Configuration
    HISTORICAL_HALF_LIFE_DAYS: float = 365.0
    HISTORICAL_MAX_RADIUS_KM: float = 10.0
    
    # Simulation
    SIMULATION_MODE: bool = True
    SIMULATION_INTERVAL_SEC: int = 3

settings = Settings()
