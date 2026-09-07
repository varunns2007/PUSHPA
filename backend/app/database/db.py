from typing import Dict, List, Optional
import json
import os
from app.database.models import (
    ForestArea, SatelliteObservation, ChangeEvent, ChangePolygon,
    HistoricalIncident, TimberPermit, Vehicle, Alert, SystemSettings, RiskScoreBreakdown,
    AnalysisJob, DisturbanceEvent, AuditLogEntry, EvidenceItem
)
from app.config import settings

class InMemDB:
    def __init__(self):
        self.forests: Dict[str, ForestArea] = {}
        self.observations: Dict[str, SatelliteObservation] = {}
        self.changes: Dict[str, ChangeEvent] = {}
        self.polygons: Dict[str, ChangePolygon] = {}
        self.incidents: Dict[str, HistoricalIncident] = {}
        self.permits: Dict[str, TimberPermit] = {}
        self.vehicles: Dict[str, Vehicle] = {}
        self.alerts: List[Alert] = []
        
        # PostGIS-ready, async jobs, audit logs, and evidence stores
        self.jobs: Dict[str, AnalysisJob] = {}
        self.disturbance_events: Dict[str, DisturbanceEvent] = {}
        self.audit_logs: List[AuditLogEntry] = []
        self.evidence: Dict[str, EvidenceItem] = {}

        self.system_settings: SystemSettings = SystemSettings(
            google_maps_api_key=settings.GOOGLE_MAPS_API_KEY,
            copernicus_client_id=settings.COPERNICUS_CLIENT_ID,
            copernicus_client_secret=settings.COPERNICUS_CLIENT_SECRET,
            simulation_mode=settings.SIMULATION_MODE,
            simulation_speed_sec=settings.SIMULATION_INTERVAL_SEC,
            ndvi_non_veg_threshold=settings.NDVI_NON_VEG,
            ndvi_sparse_threshold=settings.NDVI_SPARSE,
            ndvi_moderate_threshold=settings.NDVI_MODERATE
        )

db = InMemDB()
