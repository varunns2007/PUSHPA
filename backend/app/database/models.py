from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    CREATED = "CREATED"
    INGESTING = "INGESTING"
    PREPROCESSING = "PREPROCESSING"
    NDVI_PROCESSING = "NDVI_PROCESSING"
    CHANGE_DETECTION = "CHANGE_DETECTION"
    POLYGONIZATION = "POLYGONIZATION"
    VEHICLE_CORRELATION = "VEHICLE_CORRELATION"
    PERMIT_VERIFICATION = "PERMIT_VERIFICATION"
    RISK_CALCULATION = "RISK_CALCULATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"

class AnalysisJob(BaseModel):
    id: str
    forest_id: str
    status: JobStatus = JobStatus.CREATED
    progress_pct: int = 0
    current_stage: str = "Created"
    date_before: str
    date_after: str
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    result_event_id: Optional[str] = None
    retry_count: int = 0
    provenance: Dict[str, Any] = {}

class DisturbanceEvent(BaseModel):
    """
    Persistent Disturbance Event tracking multi-date observations and expansion.
    """
    id: str
    forest_id: str
    forest_name: str
    first_detected_date: str
    latest_observation_date: str
    total_area_ha: float
    expansion_ha: float = 0.0
    status: str = "NEEDS_INVESTIGATION"  # NEEDS_INVESTIGATION, FIELD_VERIFIED, FALSE_POSITIVE, RESOLVED
    observation_ids: List[str] = []
    change_polygon_ids: List[str] = []
    latest_risk_score: int = 0
    latest_confidence: int = 100

class AuditLogEntry(BaseModel):
    id: str
    user_id: str
    user_role: str
    action: str  # e.g., "RISK_OVERRIDE", "STATUS_CHANGE", "CASE_UPDATE", "EVIDENCE_UPLOAD"
    entity_type: str  # "ALERT", "CHANGE_EVENT", "DISTURBANCE_EVENT", "PERMIT"
    entity_id: str
    timestamp: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None

class EvidenceItem(BaseModel):
    id: str
    case_id: str
    evidence_type: str  # "NDVI_CHANGE", "VEHICLE_CORRELATION", "PERMIT_VERIFICATION", "HISTORICAL_HOTSPOT"
    source: str         # "Sentinel-2 Level-2A", "GPS-Telemetry", "Permit-Registry", "Incident-Log"
    source_id: Optional[str] = None
    timestamp: str
    processing_version: str = "v1.0"
    calculation_details: Dict[str, Any] = {}
    confidence: int = 100
    file_path: Optional[str] = None

class ForestArea(BaseModel):
    id: str
    name: str
    code: str
    center_lat: float
    center_lng: float
    total_area_ha: float
    dense_veg_pct: float = 70.0
    moderate_veg_pct: float = 20.0
    sparse_veg_pct: float = 7.0
    non_veg_pct: float = 3.0
    recent_loss_ha: float = 0.0
    historical_incidents_count: int = 0
    current_risk_score: int = 15
    polygon_coordinates: List[List[float]]  # [[lng, lat], ...]

class SatelliteObservation(BaseModel):
    id: str
    forest_id: str
    satellite_name: str = "Copernicus Sentinel-2"
    product_id: str
    acquisition_date: str
    cloud_coverage_pct: float
    aoi_name: str
    min_ndvi: float
    max_ndvi: float
    mean_ndvi: float
    median_ndvi: float
    vegetation_coverage_pct: float
    processing_timestamp: str

class ChangePolygon(BaseModel):
    id: str
    forest_id: str
    event_id: str
    area_ha: float
    centroid_lat: float
    centroid_lng: float
    mean_ndvi_before: float
    mean_ndvi_after: float
    ndvi_decrease: float
    veg_loss_pct: float
    severity: str  # Low, Moderate, High, Critical
    detection_date: str
    polygon_geometry: List[List[float]]  # GeoJSON style [[lng, lat], ...]

class ChangeEvent(BaseModel):
    id: str
    forest_id: str
    forest_name: str
    observation_before_id: str
    observation_after_id: str
    date_before: str
    date_after: str
    affected_area_ha: float
    severity: str
    status: str = "Potential Unauthorized Disturbance (Needs Investigation)"
    risk_score: int
    confidence: int = 100
    polygons: List[ChangePolygon] = []

class HistoricalIncident(BaseModel):
    id: str
    incident_date: str
    latitude: float
    longitude: float
    forest_area_id: str
    forest_name: str
    incident_type: str  # Unauthorized Clearing, Timber Smuggling, Encroachment
    estimated_quantity_m3: float
    associated_vehicle_id: Optional[str] = None
    route_taken: Optional[str] = None
    status: str = "CONFIRMED"  # CONFIRMED, SUSPECTED, CLOSED

class TimberPermit(BaseModel):
    permit_id: str
    vehicle_id: str
    source_location: str
    destination: str
    approved_area: str
    approved_quantity_m3: float
    valid_from: str
    valid_until: str
    status: str  # VALID, EXPIRED, REVOKED, NOT_FOUND, UNKNOWN

class Vehicle(BaseModel):
    id: str
    vehicle_number: str
    vehicle_type: str  # Timber Truck, Heavy Hauler, Pickup
    current_lat: float
    current_lng: float
    speed_kmh: float
    heading_deg: float
    origin: str
    destination: str
    declared_quantity_m3: float
    permit_id: Optional[str] = None
    permit_status: str = "NOT_FOUND"
    risk_level: str = "LOW"
    route_history: List[List[float]] = []  # [[lat, lng], ...]
    route_deviation_km: Optional[float] = 0.0

class RiskFactor(BaseModel):
    name: str
    weight_pct: int
    contribution: int
    description: str

class RiskScoreBreakdown(BaseModel):
    total_score: int
    risk_level: str  # LOW, MODERATE, HIGH, VERY HIGH, CRITICAL
    forest_change_severity: int
    veg_density_loss: int
    permit_anomaly: int
    route_anomaly: int
    historical_risk: int
    spatial_proximity: int
    components: Dict[str, int] = {}
    factors: List[RiskFactor] = []
    ruleset_version: str = "v1.0"
    confidence: int = 100

class Alert(BaseModel):
    id: str
    timestamp: str
    alert_type: str  # Forest Disturbance Candidate, Permit Anomaly, Route Deviation, Multi-Source Correlation
    severity: str  # LOW, MODERATE, HIGH, VERY HIGH, CRITICAL
    forest_id: str
    forest_name: str
    vehicle_id: Optional[str] = None
    location_lat: float
    location_lng: float
    title: str
    description: str
    risk_score: int
    confidence: int = 100
    explainable_factors: List[str]
    investigation_status: str = "PENDING"  # PENDING, FIELD_VERIFICATION, DISMISSED, CONFIRMED
    event_id: Optional[str] = None
    ruleset_version: str = "v1.0"

class SystemSettings(BaseModel):
    google_maps_api_key: str = ""
    copernicus_client_id: str = ""
    copernicus_client_secret: str = ""
    simulation_mode: bool = True
    simulation_speed_sec: int = 3
    ndvi_non_veg_threshold: float = 0.20
    ndvi_sparse_threshold: float = 0.40
    ndvi_moderate_threshold: float = 0.60
    risk_low_max: int = 29
    risk_moderate_max: int = 49
    risk_high_max: int = 69
    risk_very_high_max: int = 84
