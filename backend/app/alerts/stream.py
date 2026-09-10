from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any

from app.database.store import ALERTS, next_id
from app.police.dispatch import dispatch_to_stations

_subscribers: list[asyncio.Queue] = []


def raise_alert(risk_result: dict[str, Any]) -> dict[str, Any]:
    alert_id = next_id("ALERT")
    polygon = risk_result.get("nearest_polygon")
    lat = risk_result.get("lat")
    lng = risk_result.get("lng")
    # Fall back to the nearest change polygon's centroid if the risk result
    # doesn't carry the vehicle's own coordinates — either way we notify
    # the jurisdiction closest to where the actual incident is.
    if (lat is None or lng is None) and polygon:
        lat, lng = polygon["centroid"]["lat"], polygon["centroid"]["lng"]

    notified_stations = []
    if lat is not None and lng is not None:
        notified_stations = dispatch_to_stations(
            lat, lng, alert_id, f"Vehicle {risk_result['vehicle_id']} — {risk_result['rating']} risk", risk_result["rating"]
        )

    alert = {
        "alert_id": alert_id,
        "vehicle_id": risk_result["vehicle_id"],
        "risk_score": risk_result["risk_score"],
        "rating": risk_result["rating"],
        "polygon_id": polygon["polygon_id"] if polygon else None,
        "created_at": datetime.utcnow().isoformat(),
        "notified_stations": notified_stations,
    }
    ALERTS.insert(0, alert)
    del ALERTS[200:]  # keep memory bounded
    _broadcast(alert)
    return alert


def raise_forest_alert(
    zone_id: str,
    zone_name: str,
    severity_word: str,
    headline: str,
    polygon_id: str | None = None,
    centroid: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Alert variant raised by the scheduled daily/periodic satellite watch
    (app/scheduler/watch.py) rather than by a vehicle risk score — same
    stream, same shape the frontend already listens to, just zone-based
    instead of vehicle-based. Also dispatches to the nearest police
    stations the instant it fires, same as a vehicle alert."""
    alert_id = next_id("ALERT")

    notified_stations = []
    if centroid:
        notified_stations = dispatch_to_stations(
            centroid["lat"], centroid["lng"], alert_id, headline, severity_word
        )

    alert = {
        "alert_id": alert_id,
        "vehicle_id": None,
        "zone_id": zone_id,
        "zone_name": zone_name,
        "risk_score": None,
        "rating": severity_word,
        "headline": headline,
        "polygon_id": polygon_id,
        "created_at": datetime.utcnow().isoformat(),
        "kind": "satellite_watch",
        "notified_stations": notified_stations,
    }
    ALERTS.insert(0, alert)
    del ALERTS[200:]
    _broadcast(alert)
    return alert


def raise_convoy_alert(signature: dict[str, Any]) -> dict[str, Any]:
    """Alert variant raised by the Convoy Correlation Engine
    (app/vehicles/convoy_correlation.py) when it finds a multi-vehicle or
    repeat-visitor pattern around a fresh clearing — escalated above a
    single vehicle's risk score because it represents a coordinated
    pattern, not an isolated reading."""
    alert_id = next_id("ALERT")
    centroid = signature["centroid"]
    headline = (
        f"Convoy signature at {signature['polygon_id']}: "
        f"{', '.join(signature['vehicles_involved'])} — {'; '.join(signature['evidence'])}"
    )
    notified_stations = dispatch_to_stations(centroid["lat"], centroid["lng"], alert_id, headline, signature["rating"])

    alert = {
        "alert_id": alert_id,
        "vehicle_id": None,
        "vehicles_involved": signature["vehicles_involved"],
        "zone_id": signature["zone_id"],
        "polygon_id": signature["polygon_id"],
        "risk_score": signature["convoy_score"],
        "rating": signature["rating"],
        "headline": headline,
        "created_at": datetime.utcnow().isoformat(),
        "kind": "convoy_signature",
        "notified_stations": notified_stations,
    }
    ALERTS.insert(0, alert)
    del ALERTS[200:]
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
