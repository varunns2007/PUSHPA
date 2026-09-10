"""
In-memory data store for PUSHPA.

NOTE ON DATA SOURCES: This backend runs in DEMO MODE by default. There is no
live Copernicus Data Space Ecosystem credential wired in, so satellite bands
are synthetically generated (see app/satellite/sentinel_client.py) rather than
fetched from orbit. Vehicle telemetry, permits, and historical incidents are
seeded demo records. Swap the functions in this module for real database /
API calls (PostGIS, Sentinel Hub, a real vehicle telemetry feed, a real
permit registry) when moving beyond demonstration.
"""
from __future__ import annotations

import itertools
from datetime import datetime, timedelta
from typing import Any

_id_counter = itertools.count(1)


def next_id(prefix: str) -> str:
    return f"{prefix}-{next(_id_counter):04d}"


# ---------------------------------------------------------------------------
# Forest zones (Western Ghats demo region)
# ---------------------------------------------------------------------------
FOREST_ZONES: list[dict[str, Any]] = [
    {
        "id": "ZONE-A",
        "name": "Nilgiri Biosphere Reserve — Zone A",
        "center": {"lat": 11.4064, "lng": 76.6932},
        "area_ha": 5250.0,
    },
    {
        "id": "ZONE-B",
        "name": "Anamalai Range — Zone B",
        "center": {"lat": 10.35, "lng": 77.05},
        "area_ha": 4820.0,
    },
    {
        "id": "ZONE-C",
        "name": "Periyar Buffer Corridor — Zone C",
        "center": {"lat": 9.462, "lng": 77.238},
        "area_ha": 3110.0,
    },
]

# ---------------------------------------------------------------------------
# Historical illegal-felling incidents (used for the +10 hotspot risk factor)
# ---------------------------------------------------------------------------
HISTORICAL_INCIDENTS: list[dict[str, Any]] = [
    {"id": "INC-0001", "zone_id": "ZONE-A", "lat": 11.409, "lng": 76.701, "date": "2023-11-02", "species": "Rosewood"},
    {"id": "INC-0002", "zone_id": "ZONE-A", "lat": 11.404, "lng": 76.689, "date": "2024-01-17", "species": "Teak"},
    {"id": "INC-0003", "zone_id": "ZONE-A", "lat": 11.411, "lng": 76.696, "date": "2024-03-05", "species": "Red Sanders"},
    {"id": "INC-0004", "zone_id": "ZONE-A", "lat": 11.402, "lng": 76.690, "date": "2024-06-21", "species": "Teak"},
    {"id": "INC-0005", "zone_id": "ZONE-A", "lat": 11.408, "lng": 76.694, "date": "2024-09-14", "species": "Rosewood"},
    {"id": "INC-0006", "zone_id": "ZONE-A", "lat": 11.406, "lng": 76.692, "date": "2025-01-09", "species": "Teak"},
    {"id": "INC-0007", "zone_id": "ZONE-A", "lat": 11.410, "lng": 76.698, "date": "2025-05-30", "species": "Red Sanders"},
    {"id": "INC-0008", "zone_id": "ZONE-A", "lat": 11.403, "lng": 76.691, "date": "2025-08-12", "species": "Rosewood"},
    {"id": "INC-0009", "zone_id": "ZONE-B", "lat": 10.348, "lng": 77.048, "date": "2024-04-11", "species": "Teak"},
    {"id": "INC-0010", "zone_id": "ZONE-B", "lat": 10.352, "lng": 77.053, "date": "2024-12-02", "species": "Rosewood"},
    {"id": "INC-0011", "zone_id": "ZONE-C", "lat": 9.460, "lng": 77.235, "date": "2025-02-19", "species": "Teak"},
]

# ---------------------------------------------------------------------------
# Timber transit permit registry
# ---------------------------------------------------------------------------
TIMBER_PERMITS: dict[str, dict[str, Any]] = {
    "TN01AB1234": {
        "permit_id": None,
        "holder": None,
        "species": None,
        "valid": False,
        "status": "UNPERMITTED",
        "approved_route": None,
        "expiry": None,
        "max_payload_kg": None,
    },
    "TN09CJ5521": {
        "permit_id": "PMT-2026-0042",
        "holder": "Sundaram Timber Traders",
        "species": "Teak",
        "valid": True,
        "status": "VALID",
        "approved_route": "NH-181 Coimbatore–Pollachi Corridor",
        "expiry": "2026-12-31",
        "max_payload_kg": 8000,
    },
    "KL07BQ9012": {
        "permit_id": "PMT-2025-1187",
        "holder": "Periyar Forest Produce Co.",
        "species": "Rosewood",
        "valid": False,
        "status": "EXPIRED",
        "approved_route": "SH-8 Kumily–Vandiperiyar Route",
        "expiry": "2025-07-01",
        "max_payload_kg": 5000,
    },
    "TN23AZ7788": {
        "permit_id": "PMT-2026-0091",
        "holder": "Nilgiri Sawmill Cooperative",
        "species": "Sandalwood",
        "valid": True,
        "status": "ROUTE_MISMATCH",
        "approved_route": "NH-67 Ooty–Gudalur Highway",
        "expiry": "2026-10-15",
        "max_payload_kg": 6000,
    },
}

# ---------------------------------------------------------------------------
# Live-ish vehicle telemetry (mutated by /vehicles/simulate-tick)
# ---------------------------------------------------------------------------
VEHICLES: dict[str, dict[str, Any]] = {
    "TN01AB1234": {
        "vehicle_id": "TN01AB1234",
        "type": "Timber Truck",
        "lat": 11.4085,
        "lng": 76.6965,
        "speed_kmh": 34,
        "heading_deg": 212,
        "cargo_weight_kg": 7200,
        "declared_species": "Teak",
        "zone_id": "ZONE-A",
        "last_update": datetime.utcnow().isoformat(),
    },
    "TN09CJ5521": {
        "vehicle_id": "TN09CJ5521",
        "type": "Timber Truck",
        "lat": 10.965,
        "lng": 76.98,
        "speed_kmh": 58,
        "heading_deg": 95,
        "cargo_weight_kg": 6100,
        "declared_species": "Teak",
        "zone_id": "ZONE-B",
        "last_update": datetime.utcnow().isoformat(),
    },
    "KL07BQ9012": {
        "vehicle_id": "KL07BQ9012",
        "type": "4x4 Transport",
        "lat": 9.463,
        "lng": 77.241,
        "speed_kmh": 21,
        "heading_deg": 300,
        "cargo_weight_kg": 4800,
        "declared_species": "Rosewood",
        "zone_id": "ZONE-C",
        "last_update": datetime.utcnow().isoformat(),
    },
}

# ---------------------------------------------------------------------------
# Vehicle position history — a rolling log of where each vehicle has been
# seen, timestamped. Populated by /vehicles/{id}/simulate-tick (and would be
# populated by a real GPS/ALPR feed in production). This is what the Convoy
# Correlation Engine (app/vehicles/convoy_correlation.py) reads to spot
# multiple vehicles converging on the same freshly-cleared polygon, or one
# vehicle returning to the same spot repeatedly — patterns a single-snapshot
# view can never show.
# ---------------------------------------------------------------------------
VEHICLE_POSITION_LOG: dict[str, list[dict[str, Any]]] = {}
POSITION_LOG_MAX_PER_VEHICLE = 200


def log_vehicle_position(vehicle_id: str, lat: float, lng: float, timestamp: str | None = None) -> None:
    entry = {"lat": lat, "lng": lng, "timestamp": timestamp or datetime.utcnow().isoformat()}
    log = VEHICLE_POSITION_LOG.setdefault(vehicle_id, [])
    log.insert(0, entry)
    del log[POSITION_LOG_MAX_PER_VEHICLE:]


# ---------------------------------------------------------------------------
# Change-detection polygons (populated by /changes/detect)
# ---------------------------------------------------------------------------
CHANGE_POLYGONS: dict[str, dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# Alerts (populated by the risk engine, consumed by the SSE stream)
# ---------------------------------------------------------------------------
ALERTS: list[dict[str, Any]] = []

# ---------------------------------------------------------------------------
# Daily/periodic satellite watch — history of automated before/after checks
# run by app/scheduler/watch.py, keyed by zone_id. Each entry is one
# scheduled comparison result (see watch.py for the shape). Kept in memory,
# newest first, capped so a long-running server doesn't grow unbounded.
# ---------------------------------------------------------------------------
WATCH_HISTORY: dict[str, list[dict[str, Any]]] = {}
WATCH_LAST_RUN_AT: str | None = None


def record_watch_result(zone_id: str, result: dict[str, Any]) -> None:
    history = WATCH_HISTORY.setdefault(zone_id, [])
    history.insert(0, result)
    del history[100:]


def seed_default_change_polygon() -> None:
    """Pre-seed the flagship CHG_POLY_001 used throughout the demo narrative."""
    if "CHG_POLY_001" in CHANGE_POLYGONS:
        return
    CHANGE_POLYGONS["CHG_POLY_001"] = {
        "polygon_id": "CHG_POLY_001",
        "zone_id": "ZONE-A",
        "centroid": {"lat": 11.4076, "lng": 76.6958},
        "area_ha": 2.73,
        "perimeter_m": 812.0,
        "ndvi_before_mean": 0.78,
        "ndvi_after_mean": 0.319,
        "vegetation_drop_pct": 59.2,
        "severity": "SEVERE",
        "detected_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
    }


seed_default_change_polygon()


def seed_demo_position_log() -> None:
    """Pre-seed a couple of prior sightings near CHG_POLY_001 so the Convoy
    Correlation Engine (app/vehicles/convoy_correlation.py) has something
    interesting to find the moment the backend boots, without waiting for
    several simulate-tick calls to build up history. Purely for demo
    narrative — safe to remove once fed by a real GPS/ALPR feed.
    """
    if VEHICLE_POSITION_LOG:
        return
    now = datetime.utcnow()
    # TN01AB1234 (unpermitted truck) — two prior passes near CHG_POLY_001,
    # both at night, ~40 minutes apart: a repeat-visitor pattern.
    log_vehicle_position("TN01AB1234", 11.4079, 76.6961, (now - timedelta(minutes=95)).isoformat())
    log_vehicle_position("TN01AB1234", 11.4085, 76.6965, (now - timedelta(minutes=25)).isoformat())
    # KL07BQ9012 (expired permit) also swings past the same polygon within
    # the same window as TN01AB1234's last sighting — two different
    # vehicles, same freshly-cleared spot, close together in time: exactly
    # the "convoy" signature a lone vehicle-risk score would miss.
    log_vehicle_position("KL07BQ9012", 11.4070, 76.6950, (now - timedelta(minutes=40)).isoformat())


seed_demo_position_log()
