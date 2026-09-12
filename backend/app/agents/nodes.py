from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
import jinja2

from app.agents.routing import compute_interception_plan
from app.agents.state import SmugglingIncidentState
from app.database.store import VEHICLES, next_id
from app.permits.registry import verify_permit
from app.vehicles.tracker import distance_to_nearest_corridor_km, haversine_km

# In-memory store for emergency police dispatches
POLICE_DISPATCH_LOGS: list[dict[str, Any]] = []

# Corridor tolerance for strict corridor conformance (500 meters = 0.5 km)
CORRIDOR_CONFORMANCE_TOLERANCE_KM = 0.5

# Jinja2 template for tactical police emergency dossier
DOSSIER_TEMPLATE_STR = """
🚨 [EMERGENCY INTERDICTION DISPATCH] PUSHPA REAL-TIME ANTI-SMUGGLING ALERT 🚨
================================================================================
INCIDENT ID: {{ dispatch_id }} | TIME (UTC): {{ timestamp }}
SUSPECT TARGET: {{ vehicle_id }} (High-Capacity Timber Transport)
JURISDICTION: {{ assigned_police_station.jurisdiction_code }} -> {{ assigned_police_station.station_name }}
EMERGENCY CONTACT: {{ assigned_police_station.phone }}

RISK ASSESSMENT: {{ risk_score }}/100 [CRITICAL PRIORITY - ARMED INTERCEPT REQUIRED]
CONVOY / TANDEM STATUS: {{ "DETECTED (Multi-Vehicle Cartel Movement)" if convoy_detected else "Single Suspect Vehicle" }}

XAI CONTRIBUTING RISK FACTORS:
{% for factor in risk_factors %}
  • [{{ factor.factor }}]: +{{ factor.points }} pts — {{ factor.explanation }}
{% endfor %}

TACTICAL ROADBLOCK INTERCEPTION PLAN:
--------------------------------------------------------------------------------
PRIMARY CHOKEPOINT : {{ target_chokepoint.name }}
HIGHWAY / PASS     : {{ target_chokepoint.road_name }}
INTERCEPT COORDS   : {{ target_chokepoint.lat }}, {{ target_chokepoint.lng }}
SMUGGLER ETA       : {{ target_chokepoint.smuggler_eta_mins }} minutes
POLICE RESPONSE ETA: {{ target_chokepoint.police_eta_mins }} minutes
TACTICAL HEADROOM  : +{{ target_chokepoint.safety_margin_mins }} minutes safety margin ({{ target_chokepoint.feasibility }})

IMMEDIATE ACTION DIRECTIVE:
1. Deploy patrol squad to {{ target_chokepoint.name }} immediately.
2. Establish pneumatic spike-strip barrier and heavy barricade across {{ target_chokepoint.road_name }}.
3. Apprehend driver, seize unpermitted timber cargo, and secure chain of custody.
================================================================================
""".strip()

jinja_env = jinja2.Environment(autoescape=False)
dossier_template = jinja_env.from_string(DOSSIER_TEMPLATE_STR)


# ---------------------------------------------------------------------------
# Agent 1: Sentinel Agent (Ingestion & Registry Checker)
# ---------------------------------------------------------------------------
def sentinel_agent(state: SmugglingIncidentState) -> SmugglingIncidentState:
    """
    Validates digital timber transit permits and verifies geometric route corridor conformance.
    """
    vehicle_id = state.get("vehicle_id", "UNKNOWN")
    coords = state.get("current_coords", (11.4085, 76.6965))
    lat, lng = coords
    declared_species = state.get("declared_species")
    cargo_weight_kg = state.get("cargo_weight_kg")

    risk_factors: list[dict[str, Any]] = list(state.get("risk_factors", []))

    # Tool 1: verify_permit
    permit_result = verify_permit(vehicle_id, declared_species, cargo_weight_kg)
    permit_status = permit_result.get("status", "UNPERMITTED")

    if not permit_result.get("valid", False):
        if permit_status == "UNPERMITTED":
            risk_factors.append({
                "factor": "Unpermitted Vehicle",
                "points": 25,
                "explanation": "No valid digital transit permit on file in the state registry.",
            })
        elif permit_status == "EXPIRED":
            risk_factors.append({
                "factor": "Expired Permit",
                "points": 25,
                "explanation": f"Permit {permit_result.get('permit_id')} expired on {permit_result.get('expiry')}.",
            })
        elif permit_status == "SPECIES_MISMATCH":
            risk_factors.append({
                "factor": "Species Mismatch",
                "points": 25,
                "explanation": permit_result.get("reason", "Cargo does not match authorized timber species."),
            })
        elif permit_status == "OVERWEIGHT":
            risk_factors.append({
                "factor": "Overweight Cargo",
                "points": 20,
                "explanation": permit_result.get("reason", "Declared cargo exceeds permitted load limit."),
            })
        else:
            risk_factors.append({
                "factor": "Permit Violation",
                "points": 25,
                "explanation": permit_result.get("reason", "Permit violation detected."),
            })

    # Tool 2: check_corridor_conformance
    corridor_dist_km = distance_to_nearest_corridor_km(lat, lng)
    if corridor_dist_km > CORRIDOR_CONFORMANCE_TOLERANCE_KM:
        risk_factors.append({
            "factor": "Off-Route Dirt Track",
            "points": 15,
            "explanation": f"Vehicle is {corridor_dist_km:.2f}km off gazetted highway transit corridors on an unmonitored interior track.",
        })

    return {
        **state,
        "permit_status": permit_status,
        "risk_factors": risk_factors,
    }


# ---------------------------------------------------------------------------
# Agent 2: Sleuth Agent (Convoy & Nocturnal Pattern Engine)
# ---------------------------------------------------------------------------
def _find_correlated_vehicles(
    coords: tuple[float, float],
    current_vehicle_id: str,
    radius_km: float = 3.0,
) -> bool:
    """
    Checks if another commercial vehicle in telemetry is moving in tandem within radius_km.
    """
    lat, lng = coords
    for v_id, v_data in VEHICLES.items():
        if v_id == current_vehicle_id:
            continue
        v_lat = v_data.get("lat")
        v_lng = v_data.get("lng")
        if v_lat is not None and v_lng is not None:
            dist = haversine_km(lat, lng, v_lat, v_lng)
            if dist <= radius_km:
                return True
    return False


def sleuth_agent(state: SmugglingIncidentState) -> SmugglingIncidentState:
    """
    Detects nocturnal movement patterns and correlated multi-vehicle timber convoys.
    """
    timestamp_str = state.get("timestamp", datetime.now(timezone.utc).isoformat())
    coords = state.get("current_coords", (11.4085, 76.6965))
    vehicle_id = state.get("vehicle_id", "UNKNOWN")
    risk_factors: list[dict[str, Any]] = list(state.get("risk_factors", []))

    # 1. Nocturnal Curfew Pattern (22:00 to 05:00)
    try:
        # Handle ISO timestamps with Z or offset
        ts_clean = timestamp_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts_clean)
        hour = dt.hour
    except Exception:
        hour = datetime.now(timezone.utc).hour

    if hour >= 22 or hour < 5:
        risk_factors.append({
            "factor": "Nocturnal Transit",
            "points": 30,
            "explanation": f"Vehicle operating during restricted dead-of-night curfew hours ({hour:02d}:00 UTC).",
        })

    # 2. Convoy & Tandem Correlation Tool
    convoy_detected = _find_correlated_vehicles(coords, vehicle_id, radius_km=3.0)
    if convoy_detected:
        risk_factors.append({
            "factor": "Convoy / Tandem Haul",
            "points": 10,
            "explanation": "Correlated secondary transport vehicle operating in spatial synchronization within 3.0km.",
        })

    total_points = sum(f.get("points", 0) for f in risk_factors)
    bounded_risk_score = min(100, max(0, total_points))

    return {
        **state,
        "convoy_detected": convoy_detected,
        "risk_factors": risk_factors,
        "risk_score": bounded_risk_score,
    }


# ---------------------------------------------------------------------------
# Agent 3: Strategist Agent (Topological Road Interception Router)
# ---------------------------------------------------------------------------
def strategist_agent(state: SmugglingIncidentState) -> SmugglingIncidentState:
    """
    Computes topological road interception chokepoints and assigns responding police stations.
    Fired only when risk_score >= 80.
    """
    coords = state.get("current_coords", (11.4085, 76.6965))
    lat, lng = coords
    speed_kmh = state.get("speed_kmh", 40.0)
    heading = state.get("heading", 0.0)

    plan = compute_interception_plan(
        smuggler_lat=lat,
        smuggler_lng=lng,
        smuggler_speed_kmh=speed_kmh,
        smuggler_heading=heading,
    )

    return {
        **state,
        "target_chokepoint": plan["target_chokepoint"],
        "assigned_police_station": plan["assigned_police_station"],
    }


# ---------------------------------------------------------------------------
# Agent 4: Dispatcher Agent (Automated Police Interdiction Disseminator)
# ---------------------------------------------------------------------------
def dispatcher_agent(state: SmugglingIncidentState) -> SmugglingIncidentState:
    """
    Generates high-priority police dossier and executes tactical alert dispatch.
    """
    dispatch_id = next_id("DISP")
    timestamp = state.get("timestamp", datetime.now(timezone.utc).isoformat())

    # Render Jinja2 tactical dossier
    rendered_dossier = dossier_template.render(
        dispatch_id=dispatch_id,
        timestamp=timestamp,
        vehicle_id=state.get("vehicle_id", "UNKNOWN"),
        assigned_police_station=state.get("assigned_police_station", {}),
        risk_score=state.get("risk_score", 0),
        convoy_detected=state.get("convoy_detected", False),
        risk_factors=state.get("risk_factors", []),
        target_chokepoint=state.get("target_chokepoint", {}),
    )

    dispatch_record = {
        "dispatch_id": dispatch_id,
        "timestamp": timestamp,
        "vehicle_id": state.get("vehicle_id", "UNKNOWN"),
        "risk_score": state.get("risk_score", 0),
        "target_chokepoint": state.get("target_chokepoint"),
        "assigned_police_station": state.get("assigned_police_station"),
        "dossier": rendered_dossier,
        "dispatch_channel": "POLICE_EMERGENCY_MESH_SMS",
        "status": "SENT",
    }

    POLICE_DISPATCH_LOGS.insert(0, dispatch_record)
    del POLICE_DISPATCH_LOGS[100:]  # keep bounded

    return {
        **state,
        "dispatch_payload": rendered_dossier,
        "dispatch_status": "SENT",
    }
