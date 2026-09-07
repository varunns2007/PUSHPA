import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database.models import HistoricalIncident
from app.config import settings

class HistoricalRiskCalculator:
    @staticmethod
    def calculate_historical_risk(
        lat: float,
        lng: float,
        incidents: List[HistoricalIncident],
        reference_date: Optional[datetime] = None,
        half_life_days: float = 365.0,
        max_radius_km: float = 10.0
    ) -> Dict[str, Any]:
        """
        Calculates time-decayed and distance-weighted historical risk.
        Historical Risk Score = Sum_i ( Severity_i * SpatialWeight_i * TemporalWeight_i )
        """
        ref_dt = reference_date or datetime.now()
        total_weighted_score = 0.0
        relevant_incidents = 0

        for inc in incidents:
            # Spatial Distance (Haversine km)
            dlat = math.radians(inc.latitude - lat)
            dlng = math.radians(inc.longitude - lng)
            a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(inc.latitude)) * math.sin(dlng / 2.0)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = 6371.0 * c

            if dist_km > max_radius_km:
                continue

            relevant_incidents += 1
            # Spatial decay: Gaussian-like or linear (1.0 at 0km down to 0.0 at max_radius_km)
            spatial_weight = max(0.0, 1.0 - (dist_km / max_radius_km))

            # Temporal decay: Exponential half-life decay
            try:
                inc_dt = datetime.fromisoformat(inc.incident_date[:10])
                age_days = max(0.0, (ref_dt - inc_dt).total_seconds() / 86400.0)
                temporal_weight = math.pow(0.5, age_days / half_life_days)
            except Exception:
                temporal_weight = 0.5  # Fallback

            # Severity weight based on estimated timber volume or incident type
            sev_multiplier = 1.0
            if getattr(inc, "estimated_quantity_m3", 0) > 30.0:
                sev_multiplier = 1.5

            total_weighted_score += sev_multiplier * spatial_weight * temporal_weight

        # Scale into historical risk score (0 to 10 max weight)
        scaled_score = min(10, int(total_weighted_score * 2.5))

        return {
            "historical_risk_score": scaled_score,
            "relevant_incidents_count": relevant_incidents,
            "total_incidents_checked": len(incidents),
            "max_radius_km": max_radius_km,
            "decay_half_life_days": half_life_days
        }

historical_risk_calculator = HistoricalRiskCalculator()
