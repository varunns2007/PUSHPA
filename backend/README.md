# PUSHPA Backend

FastAPI implementation of the PUSHPA Forest Intelligence pipeline: NDVI
analysis, change-detection polygon extraction, vehicle telemetry & route
anomalies, timber permit verification, the Explainable Risk Engine, an
SSE alert stream, and the 10-step demo incident scenario.

## Run it

```bash
python3 -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docs at http://localhost:8000/docs.

## Demo mode

This backend ships with **no live external credentials**:

- `app/satellite/sentinel_client.py` generates deterministic synthetic
  Sentinel-2 B04/B08 bands instead of querying the Copernicus Data Space
  Ecosystem. Swap `fetch_bands()` for a real STAC/OpenEO/SentinelHub call
  to go live — everything downstream (NDVI, change detection, polygon
  extraction) is unchanged.
- `app/database/store.py` seeds forest zones, historical incidents, timber
  permits, and vehicle telemetry in memory. Replace with real database
  models (PostGIS is a natural fit for the geospatial tables) and a real
  GPS/permit-registry integration for production use.

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forests` | List forest zones |
| GET | `/api/satellite/ndvi?zone_id=&severity=` | Synthetic NDVI query |
| GET | `/api/satellite/compare?zone_id=` | Before/after NDVI summary |
| POST | `/api/changes/detect` | Run the full change-detection pipeline |
| GET | `/api/changes` | List extracted change polygons |
| GET | `/api/vehicles` | List tracked vehicles + live anomaly flags |
| POST | `/api/vehicles/{id}/simulate-tick` | Nudge a vehicle's position (fake live feed) |
| GET | `/api/permits/{vehicle_id}` | Verify a timber transit permit |
| GET | `/api/risk/{vehicle_id}` | Explainable risk score + factor breakdown |
| GET | `/api/alerts` | Recent dispatched alerts |
| GET | `/api/alerts/stream` | Server-Sent Events alert stream |
| GET | `/api/incidents` | Historical illegal-felling incident log |
| POST | `/api/demo/run-scenario` | Run the full 10-step incident story |

## Risk formula

```
Change Severity     +30   canopy loss > 50% in a nearby tile
Permit Violation    +25   unpermitted / expired / species mismatch
Spatial Proximity   +20   vehicle within 3.0km of a fresh clearing
Route Anomaly       +15   deviating into restricted interior tracks
Historical Hotspot  +10   zone has > 5 previous felling records
```
Capped at 100. See `app/risk/engine.py` for the exact implementation and
per-factor breakdown returned to the frontend.
