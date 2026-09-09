from __future__ import annotations

from datetime import date
from typing import Any

from app.database.store import TIMBER_PERMITS


def verify_permit(vehicle_id: str, declared_species: str | None = None, cargo_weight_kg: float | None = None) -> dict[str, Any]:
    record = TIMBER_PERMITS.get(vehicle_id)
    if not record or not record.get("permit_id"):
        return {
            "vehicle_id": vehicle_id,
            "status": "UNPERMITTED",
            "valid": False,
            "reason": "No permit on file for this registration number.",
        }

    reasons: list[str] = []
    status = "VALID"

    expiry = record.get("expiry")
    if expiry:
        try:
            if date.fromisoformat(expiry) < date.today():
                status = "EXPIRED"
                reasons.append(f"Permit expired on {expiry}.")
        except ValueError:
            pass

    if declared_species and record.get("species") and declared_species.lower() != record["species"].lower():
        status = "SPECIES_MISMATCH" if status == "VALID" else status
        reasons.append(f"Declared species '{declared_species}' does not match authorized species '{record['species']}'.")

    if cargo_weight_kg and record.get("max_payload_kg") and cargo_weight_kg > record["max_payload_kg"]:
        status = "OVERWEIGHT" if status == "VALID" else status
        reasons.append(f"Declared cargo {cargo_weight_kg}kg exceeds authorized {record['max_payload_kg']}kg.")

    if record.get("status") == "ROUTE_MISMATCH":
        status = "ROUTE_MISMATCH" if status == "VALID" else status
        reasons.append("Vehicle transit route does not match the approved corridor on file.")

    return {
        "vehicle_id": vehicle_id,
        "permit_id": record.get("permit_id"),
        "holder": record.get("holder"),
        "authorized_species": record.get("species"),
        "approved_route": record.get("approved_route"),
        "expiry": expiry,
        "status": status,
        "valid": status == "VALID",
        "reason": " ".join(reasons) if reasons else "Permit valid and in good standing.",
    }
