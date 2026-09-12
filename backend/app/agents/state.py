from __future__ import annotations

from typing import Any, Optional, TypedDict


class SmugglingIncidentState(TypedDict, total=False):
    vehicle_id: str
    timestamp: str  # ISO UTC timestamp
    current_coords: tuple[float, float]  # (lat, lng)
    heading: float  # degrees 0-360
    speed_kmh: float
    cargo_weight_kg: Optional[float]
    declared_species: Optional[str]
    permit_status: Optional[str]  # "VALID", "EXPIRED", "UNPERMITTED", "SPECIES_MISMATCH", etc.
    risk_score: int  # 0-100 bounded
    risk_factors: list[dict[str, Any]]  # [{"factor": str, "points": int, "explanation": str}]
    convoy_detected: bool
    target_chokepoint: Optional[dict[str, Any]]  # {"name": str, "lat": float, "lng": float, "smuggler_eta_mins": float, "police_eta_mins": float, "feasibility": str}
    assigned_police_station: Optional[dict[str, Any]]  # {"station_name": str, "phone": str, "jurisdiction_code": str}
    dispatch_payload: Optional[str]  # Formatted emergency text message / dossier
    dispatch_status: str  # "PENDING", "SENT", "SKIPPED"
