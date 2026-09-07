# PUSHPA REST API Specification

## Endpoints

### 1. Analysis Jobs (Async Queue)
- `POST /api/analysis/jobs`
  - Request: `{ "forest_id": "FOREST_001", "date_before": "2026-08-01", "date_after": "2026-09-01" }`
  - Response: `AnalysisJob` (`status: "CREATED"`, `progress_pct: 0`)
- `GET /api/analysis/jobs`
  - Response: `List[AnalysisJob]`
- `GET /api/analysis/jobs/{job_id}`
  - Response: `AnalysisJob` (returns current state machine stage and result event ID)

### 2. Forest Change Detection
- `GET /api/changes`
  - Query: `forest_id` (optional)
  - Response: `List[ChangeEvent]`
- `GET /api/changes/{change_id}`
  - Response: `ChangeEvent`

### 3. Risk Engine
- `POST /api/risk/calculate`
  - Request: `{ "forest_id": "FOREST_001", "change_event_id": "EVT_001", "vehicle_id": "VEH_001" }`
  - Response: `RiskScoreBreakdown` (total_score, confidence, components, ruleset_version)

### 4. Vehicle Intelligence & Telemetry
- `GET /api/vehicles`
  - Response: `List[Vehicle]`
- `GET /api/vehicles/{vehicle_id}`
  - Response: `Vehicle`

### 5. Timber Permits
- `GET /api/permits`
  - Response: `List[TimberPermit]`
- `GET /api/permits/{permit_id}`
  - Response: `TimberPermit`

### 6. Alerts & Deduplication
- `GET /api/alerts`
  - Response: `List[Alert]`
- `PUT /api/alerts/{alert_id}/status`
  - Query: `status` (`PENDING`, `FIELD_VERIFICATION`, `DISMISSED`, `CONFIRMED`)
  - Response: `Alert`
