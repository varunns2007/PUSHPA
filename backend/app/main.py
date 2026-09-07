import sys
import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Ensure root workspace and app directory are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import settings
from app.api import forests, satellite, changes, vehicles, routes, permits, incidents, risk, alerts, settings as sys_settings
from app.database.db import db
from scripts.generate_demo_data import seed_demo_data
from app.vehicles.simulator import vehicle_simulator

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(forests.router, prefix=settings.API_PREFIX)
app.include_router(satellite.router, prefix=settings.API_PREFIX)
app.include_router(changes.router, prefix=settings.API_PREFIX)
app.include_router(vehicles.router, prefix=settings.API_PREFIX)
app.include_router(routes.router, prefix=settings.API_PREFIX)
app.include_router(permits.router, prefix=settings.API_PREFIX)
app.include_router(incidents.router, prefix=settings.API_PREFIX)
app.include_router(risk.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(sys_settings.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def startup_event():
    seed_demo_data()
    print("PUSHPA Backend Initialized with Demo Dataset!")

@app.get("/")
def root():
    return {
        "system": "PUSHPA",
        "title": "Predictive Unified System for Forest Protection & Anti-Smuggling",
        "status": "ONLINE",
        "version": settings.VERSION,
        "docs_url": "/api/docs"
    }

@app.get("/api/stream/events")
async def stream_live_events():
    async def event_generator():
        while True:
            await asyncio.sleep(db.system_settings.simulation_speed_sec)
            vehicle_simulator.vehicles = db.vehicles
            updated_vehicles = vehicle_simulator.step_simulation()
            
            data = {
                "timestamp": asyncio.get_event_loop().time(),
                "active_vehicles": [v.dict() for v in updated_vehicles[:5]],
                "alerts_count": len(db.alerts),
                "latest_alert": db.alerts[0].dict() if db.alerts else None
            }
            yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
