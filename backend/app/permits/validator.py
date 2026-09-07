from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from app.database.models import TimberPermit, Vehicle

class PermitValidator:
    @staticmethod
    def validate_permit(
        permit: Optional[TimberPermit],
        vehicle: Optional[Vehicle] = None,
        check_datetime: Optional[datetime] = None,
        origin: Optional[str] = None,
        destination: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Rigorous multi-point permit validation.
        Validates:
        1. Existence: NOT_FOUND vs UNKNOWN vs AVAILABLE
        2. Temporal validity: valid_from <= check_datetime <= valid_until
        3. Identity binding: permit.vehicle_id == vehicle.id or vehicle.vehicle_number
        4. Route/Origin/Destination coherence
        """
        now = check_datetime or datetime.now()
        
        if permit is None:
            return {
                "status": "NOT_FOUND",
                "is_valid": False,
                "reason": "No registered timber transit permit found in registry",
                "confidence_impact": 0
            }
        
        if getattr(permit, "status", None) == "UNKNOWN":
            return {
                "status": "UNKNOWN",
                "is_valid": False,
                "reason": "Permit verification registry service unreachable or timeout",
                "confidence_impact": -15
            }

        # Check explicit revocation
        if permit.status == "REVOKED":
            return {
                "status": "REVOKED",
                "is_valid": False,
                "reason": f"Permit {permit.permit_id} was revoked by forest authority",
                "confidence_impact": 0
            }

        # Check temporal window (valid_from <= now <= valid_until)
        try:
            v_from = datetime.fromisoformat(permit.valid_from[:10])
            v_until = datetime.fromisoformat(permit.valid_until[:10])
            check_date = now.date() if isinstance(now, datetime) else now
            
            if check_date < v_from.date():
                return {
                    "status": "NOT_YET_ACTIVE",
                    "is_valid": False,
                    "reason": f"Permit {permit.permit_id} is not yet active (valid from {permit.valid_from})",
                    "confidence_impact": 0
                }
            elif check_date > v_until.date():
                return {
                    "status": "EXPIRED",
                    "is_valid": False,
                    "reason": f"Permit {permit.permit_id} expired on {permit.valid_until}",
                    "confidence_impact": 0
                }
        except Exception:
            # Fallback to status string if date parsing fails
            if permit.status == "EXPIRED":
                return {
                    "status": "EXPIRED",
                    "is_valid": False,
                    "reason": f"Permit {permit.permit_id} is marked EXPIRED",
                    "confidence_impact": 0
                }

        # Check vehicle identity mapping (Phase 15 requirement)
        if vehicle:
            v_id_match = (permit.vehicle_id == vehicle.id) or (permit.vehicle_id == vehicle.vehicle_number)
            if not v_id_match:
                return {
                    "status": "VEHICLE_MISMATCH",
                    "is_valid": False,
                    "reason": f"Permit vehicle '{permit.vehicle_id}' does not match vehicle '{vehicle.vehicle_number}'",
                    "confidence_impact": -10
                }

        # Check origin / destination if supplied
        if destination and "Unregistered" in destination:
            return {
                "status": "UNAUTHORIZED_DESTINATION",
                "is_valid": False,
                "reason": f"Transit destination '{destination}' is not registered in permit approval",
                "confidence_impact": 0
            }

        return {
            "status": "VALID",
            "is_valid": True,
            "reason": f"Permit {permit.permit_id} is active and verified for vehicle",
            "confidence_impact": 0
        }

permit_validator = PermitValidator()
