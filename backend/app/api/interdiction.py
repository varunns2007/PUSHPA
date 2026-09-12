from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.agents.graph import interdiction_pipeline
from app.agents.nodes import POLICE_DISPATCH_LOGS
from app.agents.routing import CHOKEPOINTS, POLICE_STATIONS
from app.alerts.stream import _broadcast
from app.database.store import ALERTS, next_id

router = APIRouter(prefix="/api", tags=["Multi-Agent Interdiction"])


class TelemetryIngestRequest(BaseModel):
    vehicle_id: str = Field(..., description="Vehicle registration number / license plate", examples=["TN43E9912"])
    timestamp: Optional[str] = Field(None, description="ISO UTC timestamp (defaults to now)", examples=["2026-09-12T02:30:00Z"])
    lat: float = Field(..., description="Latitude coordinate", examples=[11.4085])
    lng: float = Field(..., description="Longitude coordinate", examples=[76.6965])
    heading_deg: Optional[float] = Field(0.0, description="Heading in degrees (0-360)", examples=[212.0])
    speed_kmh: Optional[float] = Field(35.0, description="Speed in km/h", examples=[42.0])
    cargo_weight_kg: Optional[float] = Field(None, description="Measured cargo weight in kg", examples=[7500.0])
    declared_species: Optional[str] = Field(None, description="Declared timber species", examples=["Teak"])
    source: Optional[str] = Field("GPS_TELEMETRY", description="Telemetry source: GPS_TELEMETRY | FASTAG_TOLL_PING | RFID_CHECKPOINT")



class TelemetryIngestResponse(BaseModel):
    status: str
    vehicle_id: str
    risk_score: int
    rating: str
    permit_status: Optional[str]
    convoy_detected: bool
    risk_factors: list[dict[str, Any]]
    target_chokepoint: Optional[dict[str, Any]]
    assigned_police_station: Optional[dict[str, Any]]
    dispatch_status: str
    dispatch_payload: Optional[str]
    execution_time_ms: float
    processed_at: str


@router.post("/telemetry/ingest", response_model=TelemetryIngestResponse)
async def ingest_telemetry(payload: TelemetryIngestRequest):
    """
    Real-Time Telemetry / FASTag Ingestion & Multi-Agent AI Interdiction Pipeline.
    Passes telemetry payload through the LangGraph StateGraph (Sentinel -> Sleuth -> Strategist -> Dispatcher).
    Broadcasts critical alerts to the SSE stream and returns tactical dispatch decisions in < 500ms.
    """
    start_time = datetime.now(timezone.utc)
    ts = payload.timestamp or start_time.isoformat()

    initial_state = {
        "vehicle_id": payload.vehicle_id,
        "timestamp": ts,
        "current_coords": (payload.lat, payload.lng),
        "heading": payload.heading_deg or 0.0,
        "speed_kmh": payload.speed_kmh or 0.0,
        "cargo_weight_kg": payload.cargo_weight_kg,
        "declared_species": payload.declared_species,
        "permit_status": None,
        "risk_score": 0,
        "risk_factors": [],
        "convoy_detected": False,
        "target_chokepoint": None,
        "assigned_police_station": None,
        "dispatch_payload": None,
        "dispatch_status": "SKIPPED",
    }

    # Execute LangGraph Multi-Agent Pipeline
    result = interdiction_pipeline.invoke(initial_state)

    score = result.get("risk_score", 0)
    rating = (
        "CRITICAL" if score >= 80 else
        "HIGH" if score >= 60 else
        "MODERATE" if score >= 35 else
        "LOW"
    )

    # Broadcast to SSE feed if high or critical risk
    if rating in ("HIGH", "CRITICAL"):
        alert_event = {
            "alert_id": next_id("AGENT-ALERT"),
            "vehicle_id": payload.vehicle_id,
            "risk_score": score,
            "rating": rating,
            "chokepoint": result.get("target_chokepoint", {}).get("name") if result.get("target_chokepoint") else None,
            "assigned_police_station": result.get("assigned_police_station", {}).get("station_name") if result.get("assigned_police_station") else None,
            "dispatch_status": result.get("dispatch_status", "SKIPPED"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        ALERTS.insert(0, alert_event)
        del ALERTS[200:]
        _broadcast(alert_event)

    exec_duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000.0

    return TelemetryIngestResponse(
        status="PROCESSED",
        vehicle_id=payload.vehicle_id,
        risk_score=score,
        rating=rating,
        permit_status=result.get("permit_status"),
        convoy_detected=result.get("convoy_detected", False),
        risk_factors=result.get("risk_factors", []),
        target_chokepoint=result.get("target_chokepoint"),
        assigned_police_station=result.get("assigned_police_station"),
        dispatch_status=result.get("dispatch_status", "SKIPPED"),
        dispatch_payload=result.get("dispatch_payload"),
        execution_time_ms=round(exec_duration_ms, 2),
        processed_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/police-stations/dispatch-log")
async def get_dispatch_logs():
    """
    Returns recorded tactical emergency dispatches sent to regional police stations.
    """
    return {
        "count": len(POLICE_DISPATCH_LOGS),
        "dispatches": POLICE_DISPATCH_LOGS,
    }


@router.get("/police-stations/list")
async def list_police_stations():
    """
    Returns active regional police stations, emergency contacts, and response telemetry.
    """
    return {
        "count": len(POLICE_STATIONS),
        "police_stations": POLICE_STATIONS,
        "strategic_chokepoints": CHOKEPOINTS,
    }
