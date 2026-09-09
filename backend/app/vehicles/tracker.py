from __future__ import annotations

import math
from datetime import datetime
from typing import Any

PROXIMITY_ALERT_KM = 3.0
NIGHT_START_HOUR = 0
NIGHT_END_HOUR = 4

# Roughly-known legal highway transit corridors (demo waypoints). A vehicle
# whose nearest distance to every corridor exceeds ROUTE_TOLERANCE_KM is
# flagged as travelling an unmonitored interior track.
LEGAL_CORRIDORS: list[list[tuple[float, float]]] = [
    [(11.30, 76.60), (11.40, 76.70), (11.50, 76.80)],   # NH near Nilgiri
    [(10.90, 76.95), (10.97, 76.98), (11.05, 77.02)],   # NH near Anamalai
    [(9.40, 77.20), (9.46, 77.24), (9.52, 77.28)],       # SH near Periyar
]
ROUTE_TOLERANCE_KM = 4.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _distance_to_segment_km(lat: float, lng: float, a: tuple[float, float], b: tuple[float, float]) -> float:
    # approximate by sampling the segment — adequate at this scale/precision
    steps = 12
    best = float("inf")
    for i in range(steps + 1):
        t = i / steps
        plat = a[0] + (b[0] - a[0]) * t
        plng = a[1] + (b[1] - a[1]) * t
        best = min(best, haversine_km(lat, lng, plat, plng))
    return best


def distance_to_nearest_corridor_km(lat: float, lng: float) -> float:
    best = float("inf")
    for corridor in LEGAL_CORRIDORS:
        for a, b in zip(corridor, corridor[1:]):
            best = min(best, _distance_to_segment_km(lat, lng, a, b))
    return round(best, 2)


def analyze_vehicle(
    vehicle: dict[str, Any],
    change_polygons: list[dict[str, Any]],
    now: datetime | None = None,
) -> dict[str, Any]:
    now = now or datetime.utcnow()
    lat, lng = vehicle["lat"], vehicle["lng"]

    nearest_polygon = None
    nearest_km = float("inf")
    for poly in change_polygons:
        d = haversine_km(lat, lng, poly["centroid"]["lat"], poly["centroid"]["lng"])
        if d < nearest_km:
            nearest_km = d
            nearest_polygon = poly

    flags: list[str] = []
    if nearest_polygon and nearest_km <= PROXIMITY_ALERT_KM:
        flags.append("INSIDE_CHANGE_BUFFER")

    corridor_km = distance_to_nearest_corridor_km(lat, lng)
    if corridor_km > ROUTE_TOLERANCE_KM:
        flags.append("OFF_ROUTE_TRANSIT")

    hour = now.hour
    if NIGHT_START_HOUR <= hour < NIGHT_END_HOUR:
        flags.append("NOCTURNAL_MOVEMENT")

    if vehicle.get("speed_kmh", 0) > 80:
        flags.append("UNUSUAL_SPEED")

    return {
        "vehicle_id": vehicle["vehicle_id"],
        "nearest_change_polygon": nearest_polygon["polygon_id"] if nearest_polygon else None,
        "distance_to_change_km": round(nearest_km, 2) if nearest_polygon else None,
        "distance_to_legal_corridor_km": corridor_km,
        "flags": flags,
    }
