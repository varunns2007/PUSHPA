# PUSHPA Data Model Documentation

## Core Entities & Schemas

### 1. AnalysisJob
- `id`: Unique Job identifier (`JOB_xxxx_HHMMSS`)
- `forest_id`: Foreign key to target `ForestArea`
- `status`: State machine enum (`CREATED`, `INGESTING`, `PREPROCESSING`, `NDVI_PROCESSING`, `CHANGE_DETECTION`, `POLYGONIZATION`, `VEHICLE_CORRELATION`, `PERMIT_VERIFICATION`, `RISK_CALCULATION`, `COMPLETED`, `FAILED`, `PARTIAL`)
- `progress_pct`: Percentage progress (0 to 100)
- `current_stage`: Human-readable current processing step
- `date_before` / `date_after`: Temporal comparison dates
- `result_event_id`: Associated `ChangeEvent` id upon completion
- `provenance`: Dictionary tracking sensors, algorithms, and versions

### 2. DisturbanceEvent
- `id`: Event identifier (`DIST_EVT_FOREST_DATE`)
- `forest_id`: Forest region identifier
- `first_detected_date`: Inception timestamp
- `latest_observation_date`: Latest monitoring pass
- `total_area_ha`: Cumulated disturbance area in hectares
- `expansion_ha`: Area growth between passes
- `status`: `NEEDS_INVESTIGATION`, `FIELD_VERIFIED`, `FALSE_POSITIVE`, `RESOLVED`
- `observation_ids`: Linked satellite observations
- `change_polygon_ids`: Extracted spatial polygon components

### 3. ChangePolygon
- `id`: Polygon identifier
- `forest_id` / `event_id`: Linkage
- `area_ha`: Area in hectares ($m^2 / 10,000$)
- `centroid_lat` / `centroid_lng`: Geographic centroid
- `mean_ndvi_before` / `mean_ndvi_after` / `ndvi_decrease`: Spectral statistics
- `veg_loss_pct`: Percentage vegetation decline relative to baseline
- `severity`: `Low`, `Moderate`, `High`, `Critical`
- `polygon_geometry`: GeoJSON boundary coordinates `[[lng, lat], ...]`

### 4. Vehicle & Telemetry
- `id`: Unique vehicle identifier
- `vehicle_number`: License registration plate
- `vehicle_type`: Vehicle category (`Timber Hauler`, `Flatbed`, `Heavy Hauler`)
- `current_lat` / `current_lng`: Real-time position
- `speed_kmh` / `heading_deg`: Motion vectors
- `origin` / `destination`: Declared route endpoints
- `permit_id`: Linked permit if registered
- `permit_status`: `VALID`, `EXPIRED`, `REVOKED`, `NOT_FOUND`, `UNKNOWN`
- `route_history`: Track waypoints `[[lat, lng], ...]`
- `route_deviation_km`: Distance deviation from authorized corridor

### 5. TimberPermit
- `permit_id`: Permit reference
- `vehicle_id`: Canonical vehicle registration
- `source_location` / `destination`: Permitted corridor
- `valid_from` / `valid_until`: Temporal validity window
- `status`: `VALID`, `EXPIRED`, `REVOKED`, `NOT_FOUND`, `UNKNOWN`

### 6. Alert & Case
- `id`: Alert identifier (`ALT_xxxx`)
- `alert_type`: `Multi-Source Correlation`, `Permit Anomaly`, `Forest Disturbance Candidate`
- `severity`: `LOW`, `MODERATE`, `HIGH`, `VERY HIGH`, `CRITICAL`
- `forest_id` / `vehicle_id` / `event_id`: Correlation links
- `risk_score`: 0–100 risk score
- `confidence`: 0–100 data completeness & quality metric
- `explainable_factors`: Itemized contribution breakdown
- `investigation_status`: `PENDING`, `FIELD_VERIFICATION`, `DISMISSED`, `CONFIRMED`
- `ruleset_version`: Scoring model version
