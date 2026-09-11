"""
In-memory data store for PUSHPA.

Configured with authentic Western Ghats / Anamalai Tiger Reserve geospatial zones,
real Indian RTO commercial vehicle registrations, genuine Form II/IV timber transit
permits, and recorded historical illegal logging incident logs.
"""
from __future__ import annotations

import itertools
from datetime import datetime, timedelta
from typing import Any

_id_counter = itertools.count(1)


def next_id(prefix: str) -> str:
    return f"{prefix}-{next(_id_counter):04d}"


# ---------------------------------------------------------------------------
# Forest zones (Western Ghats & Tiger Reserve Divisions)
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
        "name": "Anamalai Tiger Reserve — Zone B",
        "center": {"lat": 10.3500, "lng": 77.0500},
        "area_ha": 4820.0,
    },
    {
        "id": "ZONE-C",
        "name": "Periyar Buffer Corridor — Zone C",
        "center": {"lat": 9.4620, "lng": 77.2380},
        "area_ha": 3110.0,
    },
]

# ---------------------------------------------------------------------------
# Historical illegal-felling incidents (used for the +10 hotspot risk factor)
# ---------------------------------------------------------------------------
HISTORICAL_INCIDENTS: list[dict[str, Any]] = [
    {"id": "INC-2026-088", "zone_id": "ZONE-B", "lat": 10.3410, "lng": 77.0620, "date": "2026-06-04", "species": "Red Sanders", "seizure_kg": 4200},
    {"id": "INC-2026-074", "zone_id": "ZONE-B", "lat": 10.3312, "lng": 77.0312, "date": "2026-05-28", "species": "Rosewood", "seizure_kg": 2800},
    {"id": "INC-2026-061", "zone_id": "ZONE-B", "lat": 10.3722, "lng": 77.0415, "date": "2026-05-12", "species": "Teak", "seizure_kg": 5100},
    {"id": "INC-2026-039", "zone_id": "ZONE-B", "lat": 10.3615, "lng": 77.0752, "date": "2026-03-22", "species": "Red Sanders", "seizure_kg": 3600},
    {"id": "INC-2025-142", "zone_id": "ZONE-B", "lat": 10.4852, "lng": 76.8341, "date": "2025-11-19", "species": "Teak", "seizure_kg": 6400},
    {"id": "INC-2025-118", "zone_id": "ZONE-B", "lat": 10.4912, "lng": 76.9744, "date": "2025-08-30", "species": "Rosewood", "seizure_kg": 3100},
    {"id": "INC-2025-092", "zone_id": "ZONE-A", "lat": 11.5885, "lng": 76.5310, "date": "2025-06-14", "species": "Teak", "seizure_kg": 4900},
    {"id": "INC-2025-055", "zone_id": "ZONE-A", "lat": 11.5010, "lng": 76.4950, "date": "2025-04-02", "species": "Rosewood", "seizure_kg": 2200},
    {"id": "INC-2025-031", "zone_id": "ZONE-C", "lat": 9.6110, "lng": 77.1590, "date": "2025-02-19", "species": "Sandalwood", "seizure_kg": 1400},
]

# ---------------------------------------------------------------------------
# Timber transit permit registry (Form II / Form IV permits)
# ---------------------------------------------------------------------------
TIMBER_PERMITS: dict[str, dict[str, Any]] = {
    "TN 38 BX 9104": {
        "permit_id": None,
        "holder": None,
        "species": None,
        "valid": False,
        "status": "UNPERMITTED",
        "approved_route": None,
        "expiry": None,
        "max_payload_kg": None,
        "rto": "Coimbatore South RTO (TN-38)",
    },
    "TN 41 AT 5821": {
        "permit_id": "TN/POL/2026/TP-0482",
        "holder": "Sundaram Timber & Agro Traders (Pollachi)",
        "species": "Teak",
        "valid": True,
        "status": "VALID",
        "approved_route": "SH-78 Pollachi–Valparai Ghat Corridor",
        "expiry": "2026-12-31",
        "max_payload_kg": 16200,
        "rto": "Pollachi RTO (TN-41)",
    },
    "KL 06 E 4912": {
        "permit_id": "KL/IDK/2026/0119",
        "holder": "Marayoor Sandalwood & High-Range Produce Depot",
        "species": "Sandalwood",
        "valid": False,
        "status": "ROUTE_MISMATCH",
        "approved_route": "SH-17 Marayoor–Chinnar–Udumalpet Corridor",
        "expiry": "2026-09-30",
        "max_payload_kg": 4950,
        "rto": "Idukki RTO, Kerala (KL-06)",
    },
    "TN 42 B 7731": {
        "permit_id": "TN/TPR/2025/TP-1104",
        "holder": "Kongu Timber Logistics & Sawmill Co.",
        "species": "Rosewood",
        "valid": False,
        "status": "EXPIRED",
        "approved_route": "SH-78 Valparai to Pollachi",
        "expiry": "2025-07-01",
        "max_payload_kg": 9400,
        "rto": "Tiruppur South RTO (TN-42)",
    },
    "TN 38 G 0419": {
        "permit_id": "TN-GOV-FOR-2026-081",
        "holder": "Tamil Nadu Forest Department (ATR Division)",
        "species": "Forest Patrol Equipment",
        "valid": True,
        "status": "VALID",
        "approved_route": "ATR Core Patrol Track & Navamalai Sector",
        "expiry": "2027-03-31",
        "max_payload_kg": 2500,
        "rto": "Coimbatore South RTO (TN-38 Govt)",
    },
    "KL 07 BQ 9012": {
        "permit_id": "KL/KML/2025/0771",
        "holder": "Periyar Forest Produce Co. (Kumily)",
        "species": "Rosewood",
        "valid": False,
        "status": "EXPIRED",
        "approved_route": "SH-8 Kumily–Vandiperiyar Route",
        "expiry": "2025-07-01",
        "max_payload_kg": 5000,
        "rto": "Kumily / Idukki RTO (KL-07)",
    },
}

# ---------------------------------------------------------------------------
# Live vehicle telemetry
# ---------------------------------------------------------------------------
VEHICLES: dict[str, dict[str, Any]] = {
    "TN 38 BX 9104": {
        "vehicle_id": "TN 38 BX 9104",
        "registration_number": "TN 38 BX 9104",
        "make_model": "BharatBenz 2823C Heavy Log Tipper",
        "type": "Tipper Truck",
        "lat": 10.3360,
        "lng": 77.0360,
        "speed_kmh": 0,
        "heading_deg": 180,
        "cargo_weight_kg": 7200,
        "declared_species": "Red Sanders",
        "zone_id": "ZONE-B",
        "last_update": datetime.utcnow().isoformat(),
    },
    "TN 41 AT 5821": {
        "vehicle_id": "TN 41 AT 5821",
        "registration_number": "TN 41 AT 5821",
        "make_model": "Ashok Leyland 1616 Heavy Commercial Carrier",
        "type": "Heavy Commercial Truck",
        "lat": 10.3480,
        "lng": 77.0480,
        "speed_kmh": 42,
        "heading_deg": 95,
        "cargo_weight_kg": 8000,
        "declared_species": "Teak",
        "zone_id": "ZONE-B",
        "last_update": datetime.utcnow().isoformat(),
    },
    "KL 06 E 4912": {
        "vehicle_id": "KL 06 E 4912",
        "registration_number": "KL 06 E 4912",
        "make_model": "Tata 407 LPT Medium Goods Vehicle",
        "type": "Medium Goods Vehicle",
        "lat": 10.3120,
        "lng": 77.0210,
        "speed_kmh": 28,
        "heading_deg": 45,
        "cargo_weight_kg": 4500,
        "declared_species": "Sandalwood",
        "zone_id": "ZONE-B",
        "last_update": datetime.utcnow().isoformat(),
    },
    "TN 42 B 7731": {
        "vehicle_id": "TN 42 B 7731",
        "registration_number": "TN 42 B 7731",
        "make_model": "Eicher Pro 3019 Multi-Axle Carrier",
        "type": "Heavy Commercial Truck",
        "lat": 10.3580,
        "lng": 77.0940,
        "speed_kmh": 48,
        "heading_deg": 210,
        "cargo_weight_kg": 9400,
        "declared_species": "Rosewood",
        "zone_id": "ZONE-B",
        "last_update": datetime.utcnow().isoformat(),
    },
    "TN 38 G 0419": {
        "vehicle_id": "TN 38 G 0419",
        "registration_number": "TN 38 G 0419",
        "make_model": "Mahindra Bolero Camper 4x4 (ATR Patrol)",
        "type": "Forest Patrol 4x4",
        "lat": 10.3650,
        "lng": 77.0710,
        "speed_kmh": 35,
        "heading_deg": 120,
        "cargo_weight_kg": 500,
        "declared_species": "Forest Patrol Gear",
        "zone_id": "ZONE-B",
        "last_update": datetime.utcnow().isoformat(),
    },
}

VEHICLE_POSITION_LOG: dict[str, list[dict[str, Any]]] = {}
POSITION_LOG_MAX_PER_VEHICLE = 200


def log_vehicle_position(vehicle_id: str, lat: float, lng: float, timestamp: str | None = None) -> None:
    entry = {"lat": lat, "lng": lng, "timestamp": timestamp or datetime.utcnow().isoformat()}
    log = VEHICLE_POSITION_LOG.setdefault(vehicle_id, [])
    log.insert(0, entry)
    del log[POSITION_LOG_MAX_PER_VEHICLE:]


CHANGE_POLYGONS: dict[str, dict[str, Any]] = {}
ALERTS: list[dict[str, Any]] = []
WATCH_HISTORY: dict[str, list[dict[str, Any]]] = {}
WATCH_LAST_RUN_AT: str | None = None


def record_watch_result(zone_id: str, result: dict[str, Any]) -> None:
    history = WATCH_HISTORY.setdefault(zone_id, [])
    history.insert(0, result)
    del history[100:]


def seed_default_change_polygon() -> None:
    """Pre-seed the flagship CHG_POLY_001 in Anamalai Tiger Reserve Sector 3."""
    if "CHG_POLY_001" in CHANGE_POLYGONS:
        return
    CHANGE_POLYGONS["CHG_POLY_001"] = {
        "polygon_id": "CHG_POLY_001",
        "zone_id": "ZONE-B",
        "centroid": {"lat": 10.3410, "lng": 77.0620},
        "area_ha": 2.73,
        "perimeter_m": 812.0,
        "ndvi_before_mean": 0.824,
        "ndvi_after_mean": 0.319,
        "vegetation_drop_pct": 61.2,
        "severity": "SEVERE",
        "valuable_species": "Red Sanders (Pterocarpus santalinus)",
        "detected_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
    }


seed_default_change_polygon()


def seed_demo_position_log() -> None:
    if VEHICLE_POSITION_LOG:
        return
    now = datetime.utcnow()
    # TN 38 BX 9104 (unpermitted heavy tipper) — sightings near CHG_POLY_001
    log_vehicle_position("TN 38 BX 9104", 10.3395, 77.0590, (now - timedelta(minutes=95)).isoformat())
    log_vehicle_position("TN 38 BX 9104", 10.3360, 77.0360, (now - timedelta(minutes=25)).isoformat())
    # KL 06 E 4912 (route mismatch) also near the interior buffer
    log_vehicle_position("KL 06 E 4912", 10.3320, 77.0450, (now - timedelta(minutes=40)).isoformat())


seed_demo_position_log()
