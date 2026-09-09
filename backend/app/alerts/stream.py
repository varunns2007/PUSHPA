from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any

from app.database.store import ALERTS, next_id

_subscribers: list[asyncio.Queue] = []


def raise_alert(risk_result: dict[str, Any]) -> dict[str, Any]:
    alert = {
        "alert_id": next_id("ALERT"),
        "vehicle_id": risk_result["vehicle_id"],
        "risk_score": risk_result["risk_score"],
        "rating": risk_result["rating"],
        "polygon_id": risk_result["nearest_polygon"]["polygon_id"] if risk_result.get("nearest_polygon") else None,
        "created_at": datetime.utcnow().isoformat(),
    }
    ALERTS.insert(0, alert)
    del ALERTS[200:]  # keep memory bounded
    _broadcast(alert)
    return alert


def _broadcast(alert: dict[str, Any]) -> None:
    for q in list(_subscribers):
        try:
            q.put_nowait(alert)
        except asyncio.QueueFull:
            pass


async def event_stream():
    queue: asyncio.Queue = asyncio.Queue(maxsize=50)
    _subscribers.append(queue)
    try:
        yield {"event": "connected", "data": json.dumps({"status": "connected"})}
        while True:
            alert = await queue.get()
            yield {"event": "alert", "data": json.dumps(alert)}
    finally:
        _subscribers.remove(queue)
