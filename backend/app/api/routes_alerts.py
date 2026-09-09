from __future__ import annotations

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.alerts.stream import event_stream
from app.database.store import ALERTS, HISTORICAL_INCIDENTS

router = APIRouter(prefix="/api", tags=["alerts"])


@router.get("/alerts")
def list_alerts():
    return {"alerts": ALERTS[:50]}


@router.get("/alerts/stream")
async def alerts_stream():
    return EventSourceResponse(event_stream())


@router.get("/incidents")
def list_incidents(zone_id: str | None = None):
    incidents = HISTORICAL_INCIDENTS
    if zone_id:
        incidents = [i for i in incidents if i["zone_id"] == zone_id]
    return {"incidents": incidents}
