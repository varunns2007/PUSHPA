from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    interdiction,
    routes_alerts,
    routes_changes,
    routes_convoy,
    routes_demo,
    routes_forests,
    routes_permits,
    routes_police,
    routes_risk,
    routes_satellite,
    routes_vehicles,
    routes_watch,
)
from app.scheduler.watch import start_scheduler, stop_scheduler

app = FastAPI(
    title="PUSHPA Backend",
    description=(
        "Forest Intelligence & Anti-Smuggling API. Runs entirely on synthetic "
        "demo data by default — see app/database/store.py and "
        "app/satellite/sentinel_client.py for where to wire in real "
        "Copernicus / vehicle-telemetry / permit-registry integrations."
    ),
    version="0.2.0",
)

# Wide-open CORS for local hackathon demo use. Restrict this before any
# real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interdiction.router)
app.include_router(routes_forests.router)
app.include_router(routes_satellite.router)
app.include_router(routes_changes.router)
app.include_router(routes_vehicles.router)
app.include_router(routes_permits.router)
app.include_router(routes_risk.router)
app.include_router(routes_alerts.router)
app.include_router(routes_demo.router)
app.include_router(routes_watch.router)
app.include_router(routes_police.router)
app.include_router(routes_convoy.router)

# The daily/periodic satellite watch (app/scheduler/watch.py) runs in the
# background for the life of the process. Disable with WATCH_ENABLED=0 if
# you only want on-demand comparisons via the API/UI.
_watch_enabled = os.getenv("WATCH_ENABLED", "1") == "1"


@app.on_event("startup")
def _on_startup():
    if _watch_enabled:
        start_scheduler()


@app.on_event("shutdown")
def _on_shutdown():
    if _watch_enabled:
        stop_scheduler()



@app.get("/api/health")
def health():
    live = os.getenv("USE_LIVE_SATELLITE", "0") == "1"
    return {
        "status": "ok",
        "mode": "LIVE" if live else "DEMO",
        "watch_enabled": _watch_enabled,
    }
