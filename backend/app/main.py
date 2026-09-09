from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    routes_alerts,
    routes_changes,
    routes_demo,
    routes_forests,
    routes_permits,
    routes_risk,
    routes_satellite,
    routes_vehicles,
)

app = FastAPI(
    title="PUSHPA Backend",
    description=(
        "Forest Intelligence & Anti-Smuggling API. Runs entirely on synthetic "
        "demo data by default — see app/database/store.py and "
        "app/satellite/sentinel_client.py for where to wire in real "
        "Copernicus / vehicle-telemetry / permit-registry integrations."
    ),
    version="0.1.0",
)

# Wide-open CORS for local hackathon demo use. Restrict this before any
# real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_forests.router)
app.include_router(routes_satellite.router)
app.include_router(routes_changes.router)
app.include_router(routes_vehicles.router)
app.include_router(routes_permits.router)
app.include_router(routes_risk.router)
app.include_router(routes_alerts.router)
app.include_router(routes_demo.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "DEMO"}
