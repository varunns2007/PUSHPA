from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.agents.graph import interdiction_pipeline
from app.agents.state import SmugglingIncidentState
from app.main import app

client = TestClient(app)


def test_benign_vehicle_transit():
    """
    Test Case 1: A legally permitted timber truck operating on a gazetted highway
    corridor during daylight hours (14:00 UTC) must score < 35 (LOW) and bypass police dispatch.
    """
    state: SmugglingIncidentState = {
        "vehicle_id": "TN09CJ5521",  # Legally registered in store.py
        "timestamp": "2026-09-12T14:00:00Z",
        "current_coords": (10.965, 76.98),  # On recognized NH corridor near Anamalai
        "heading": 95.0,
        "speed_kmh": 58.0,
        "cargo_weight_kg": 6000.0,
        "declared_species": "Teak",
        "permit_status": None,
        "risk_score": 0,
        "risk_factors": [],
        "convoy_detected": False,
        "target_chokepoint": None,
        "assigned_police_station": None,
        "dispatch_payload": None,
        "dispatch_status": "SKIPPED",
    }

    result = interdiction_pipeline.invoke(state)

    assert result["permit_status"] == "VALID"
    assert result["risk_score"] < 35, f"Expected LOW risk (<35), got {result['risk_score']}"
    assert result.get("dispatch_status") == "SKIPPED"
    assert result.get("target_chokepoint") is None
    assert result.get("dispatch_payload") is None


def test_unpermitted_night_smuggling_interdiction():
    """
    Test Case 2: An unpermitted truck running on an unmonitored interior forest dirt
    track at 02:30 UTC must score >= 80 (CRITICAL), compute a tactical topological
    road bottleneck chokepoint, and trigger an automated police emergency dispatch.
    """
    state: SmugglingIncidentState = {
        "vehicle_id": "TN43E9912",  # Unpermitted registration
        "timestamp": "2026-09-12T02:30:00Z",  # Night curfew (02:30)
        "current_coords": (11.4085, 76.6965),  # Interior Nilgiri dirt track (> 4km off highway)
        "heading": 212.0,
        "speed_kmh": 38.0,
        "cargo_weight_kg": 7500.0,
        "declared_species": "Red Sanders",
        "permit_status": None,
        "risk_score": 0,
        "risk_factors": [],
        "convoy_detected": False,
        "target_chokepoint": None,
        "assigned_police_station": None,
        "dispatch_payload": None,
        "dispatch_status": "SKIPPED",
    }

    result = interdiction_pipeline.invoke(state)

    # Assertions
    assert result["permit_status"] == "UNPERMITTED"
    assert result["risk_score"] >= 80, f"Expected CRITICAL risk (>=80), got {result['risk_score']}"
    assert result.get("dispatch_status") == "SENT"

    # Chokepoint & police station assertions
    chokepoint = result.get("target_chokepoint")
    assert chokepoint is not None
    assert "name" in chokepoint
    assert "smuggler_eta_mins" in chokepoint
    assert "police_eta_mins" in chokepoint
    assert chokepoint["smuggler_eta_mins"] > 0
    assert chokepoint["police_eta_mins"] > 0

    assigned_police = result.get("assigned_police_station")
    assert assigned_police is not None
    assert "station_name" in assigned_police
    assert "phone" in assigned_police
    assert "jurisdiction_code" in assigned_police

    # Tactical dossier assertions
    dossier = result.get("dispatch_payload")
    assert dossier is not None
    assert "EMERGENCY INTERDICTION DISPATCH" in dossier
    assert "TN43E9912" in dossier
    assert assigned_police["station_name"] in dossier
    assert chokepoint["name"] in dossier


def test_api_telemetry_ingest_endpoint():
    """
    Test Case 3: Test POST /api/telemetry/ingest endpoint with real-time payload.
    Verifies sub-second execution latency, response schema, and police dispatch log recording.
    """
    payload = {
        "vehicle_id": "TN99SMUG01",
        "timestamp": "2026-09-12T03:15:00Z",
        "lat": 11.4085,
        "lng": 76.6965,
        "heading_deg": 220.0,
        "speed_kmh": 42.0,
        "cargo_weight_kg": 8200.0,
        "declared_species": "Rosewood",
        "source": "FASTAG_TOLL_PING",
    }

    response = client.post("/api/telemetry/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "PROCESSED"
    assert data["vehicle_id"] == "TN99SMUG01"
    assert data["rating"] == "CRITICAL"
    assert data["risk_score"] >= 80
    assert data["dispatch_status"] == "SENT"
    assert data["execution_time_ms"] < 500.0  # Sub-second execution guarantee
    assert data["target_chokepoint"] is not None
    assert data["assigned_police_station"] is not None

    # Verify dispatch log endpoint
    log_response = client.get("/api/police-stations/dispatch-log")
    assert log_response.status_code == 200
    log_data = log_response.json()
    assert log_data["count"] > 0
    assert any(d["vehicle_id"] == "TN99SMUG01" for d in log_data["dispatches"])
