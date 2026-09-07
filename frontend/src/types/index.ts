export interface ForestArea {
  id: string;
  name: string;
  code: string;
  center_lat: number;
  center_lng: number;
  total_area_ha: number;
  dense_veg_pct: number;
  moderate_veg_pct: number;
  sparse_veg_pct: number;
  non_veg_pct: number;
  recent_loss_ha: number;
  historical_incidents_count: number;
  current_risk_score: number;
  polygon_coordinates: number[][];
}

export interface SatelliteObservation {
  id: string;
  forest_id: string;
  satellite_name: string;
  product_id: string;
  acquisition_date: string;
  cloud_coverage_pct: number;
  aoi_name: string;
  min_ndvi: number;
  max_ndvi: number;
  mean_ndvi: number;
  median_ndvi: number;
  vegetation_coverage_pct: number;
  processing_timestamp: string;
}

export interface ChangePolygon {
  id: string;
  forest_id: string;
  event_id: string;
  area_ha: number;
  centroid_lat: number;
  centroid_lng: number;
  mean_ndvi_before: number;
  mean_ndvi_after: number;
  ndvi_decrease: number;
  veg_loss_pct: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  detection_date: string;
  polygon_geometry: number[][];
}

export interface ChangeEvent {
  id: string;
  forest_id: string;
  forest_name: string;
  observation_before_id: string;
  observation_after_id: string;
  date_before: string;
  date_after: string;
  affected_area_ha: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  status: string;
  risk_score: number;
  polygons: ChangePolygon[];
}

export interface HistoricalIncident {
  id: string;
  incident_date: string;
  latitude: number;
  longitude: number;
  forest_area_id: string;
  forest_name: string;
  incident_type: string;
  estimated_quantity_m3: number;
  associated_vehicle_id?: string;
  route_taken?: string;
  status: string;
}

export interface TimberPermit {
  permit_id: string;
  vehicle_id: string;
  source_location: string;
  destination: string;
  approved_area: string;
  approved_quantity_m3: number;
  valid_from: string;
  valid_until: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND';
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
  heading_deg: number;
  origin: string;
  destination: string;
  declared_quantity_m3: number;
  permit_id?: string;
  permit_status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND';
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
  route_history: number[][];
}

export interface RiskFactor {
  name: string;
  weight_pct: number;
  contribution: number;
  description: string;
}

export interface RiskScoreBreakdown {
  total_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
  forest_change_severity: number;
  veg_density_loss: number;
  permit_anomaly: number;
  route_anomaly: number;
  historical_risk: number;
  spatial_proximity: number;
  components?: Record<string, number>;
  ruleset_version?: string;
  confidence?: number;
  factors: RiskFactor[];
}

export interface Alert {
  id: string;
  timestamp: string;
  alert_type: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
  forest_id: string;
  forest_name: string;
  vehicle_id?: string;
  location_lat: number;
  location_lng: number;
  title: string;
  description: string;
  risk_score: number;
  explainable_factors: string[];
  investigation_status: 'PENDING' | 'FIELD_VERIFICATION' | 'DISMISSED' | 'CONFIRMED';
}

export interface SystemSettings {
  google_maps_api_key: string;
  copernicus_client_id: string;
  copernicus_client_secret: string;
  simulation_mode: boolean;
  simulation_speed_sec: number;
  ndvi_non_veg_threshold: number;
  ndvi_sparse_threshold: number;
  ndvi_moderate_threshold: number;
  risk_low_max: number;
  risk_moderate_max: number;
  risk_high_max: number;
  risk_very_high_max: number;
}
