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

## Going live: real satellite imagery

Set `USE_LIVE_SATELLITE=1` (see `.env.example`) and the backend switches
from synthetic bands to **actual Sentinel-2 satellite passes**, fetched
live from [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com) —
a free, public mirror of the full Copernicus Sentinel-2 archive. No paid
key or credit card is required to get real imagery; an optional free
subscription key just raises the rate limit if you hit it.

What actually happens when this is on:

1. `app/satellite/live_client.py` asks Planetary Computer's catalogue
   for real scenes covering your forest zone within ~20 days of the date
   you asked for, sorted by cloud cover.
2. It opens the real Red (B04) and Near-Infrared (B08) bands of the
   clearest match and reads just the small window over your zone.
3. Everything else — `ndvi.py`, `change_detector.py`,
   `polygon_extractor.py`, the risk engine — runs completely unchanged;
   they never know whether the numbers came from orbit or from the
   synthetic generator.
4. If no cloud-free pass exists near the requested date (common in the
   monsoon), it **falls back to synthetic data automatically** rather
   than erroring, and every response says which one actually happened —
   look at the `source` field (`"live"`, `"live_unavailable_fallback"`,
   or `"synthetic"`) on any satellite/changes response.
5. Every real-imagery response also includes a `preview_url` — a direct
   link to the actual true-colour satellite photo the numbers came from,
   so a person can open the real picture, not just trust the math.

Install the extra dependencies (already in `requirements.txt`):
`pystac-client`, `planetary-computer`, `rasterio`.

## Automatic daily/periodic checking

Nobody should have to remember to open the app and pick two dates. With
the backend running, `app/scheduler/watch.py` runs in the background for
the life of the process and, on a timer (`WATCH_INTERVAL_HOURS`, default
24h = once a day), automatically re-checks every forest zone against the
last time it looked and raises an alert (via the existing `/api/alerts`
stream) if canopy loss crosses `WATCH_ALERT_THRESHOLD_PCT` (default 15%).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/watch/status` | Is the watch running, how often, when did it last check |
| GET | `/api/watch/history?zone_id=` | Every automated comparison the scheduler has run |
| POST | `/api/watch/run-now` | Trigger an out-of-schedule check immediately (useful for demos) |

Set `WATCH_ENABLED=0` to turn the timer off and only ever compare
on-demand through the API/UI. Set `WATCH_ZONE_IDS=ZONE-A,ZONE-B` to watch
a subset instead of every zone.

## Plain-language explanations

Raw NDVI numbers ("mean_ndvi: 0.72") mean nothing to a forest guard, a
district officer, or a journalist. `app/explain/plain_language.py`
re-narrates the exact same numbers every other module already computes
into one plain sentence, a severity word a human would say out loud, and
a real-world comparison — hectares converted into football fields, not
left as a number nobody can picture. It also flags when a cleared patch
overlaps a spot with a history of valuable-timber (Rosewood/Teak/Red
Sanders) felling, and always includes an honest caveat that satellite
imagery is a lead to verify, not proof by itself.

Every `/api/satellite/compare`, `/api/changes/detect`, and
`/api/watch/*` response includes a `plain_language` block with this —
that's what the frontend should show front-and-centre, with the
technical NDVI numbers available underneath for anyone who wants them.

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
| GET | `/api/watch/status` | Automatic-watch config + last-run time |
| GET | `/api/watch/history` | Automated comparison history, most recent first |
| POST | `/api/watch/run-now` | Trigger an automated check immediately |

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
