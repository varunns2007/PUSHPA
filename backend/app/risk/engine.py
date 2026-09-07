from typing import Dict, Any, List, Optional
from app.database.models import RiskScoreBreakdown, RiskFactor, ChangeEvent, Vehicle, TimberPermit, HistoricalIncident

class IllegalLoggingRiskEngine:
    def __init__(self):
        # Default configurable factor weights (%)
        self.w_change_severity = 30
        self.w_veg_loss = 20
        self.w_permit_anomaly = 20
        self.w_route_anomaly = 15
        self.w_historical_risk = 10
        self.w_spatial_proximity = 5

    def calculate_risk(
        self,
        change_event: Optional[ChangeEvent] = None,
        vehicle: Optional[Vehicle] = None,
        permit: Optional[TimberPermit] = None,
        nearby_incidents: List[HistoricalIncident] = [],
        distance_km: float = 2.5
    ) -> RiskScoreBreakdown:
        
        # 1. Forest Change Severity (30% max weight)
        change_pct = change_event.polygons[0].veg_loss_pct if (change_event and change_event.polygons) else 0.0
        if change_pct >= 50.0:
            c_severity = self.w_change_severity
            c_desc = f"Critical vegetation loss ({change_pct:.1f}%) detected in satellite AOI"
        elif change_pct >= 30.0:
            c_severity = int(self.w_change_severity * 0.75)
            c_desc = f"Significant vegetation decline ({change_pct:.1f}%)"
        elif change_pct >= 15.0:
            c_severity = int(self.w_change_severity * 0.40)
            c_desc = f"Moderate vegetation drop ({change_pct:.1f}%)"
        else:
            c_severity = 0
            c_desc = "Minor or baseline vegetation variation"

        # 2. Vegetation Density Loss (20% max weight)
        affected_area_ha = change_event.affected_area_ha if change_event else 0.0
        if affected_area_ha >= 2.5:
            c_veg = self.w_veg_loss
            v_desc = f"Large clearing area ({affected_area_ha:.2f} hectares)"
        elif affected_area_ha >= 1.0:
            c_veg = int(self.w_veg_loss * 0.75)
            v_desc = f"Substantial clearing area ({affected_area_ha:.2f} hectares)"
        elif affected_area_ha > 0.0:
            c_veg = int(self.w_veg_loss * 0.40)
            v_desc = f"Localized clearing spot ({affected_area_ha:.2f} hectares)"
        else:
            c_veg = 0
            v_desc = "No major clearing area"

        # 3. Permit Anomaly (20% max weight)
        if not permit or permit.status == "NOT_FOUND":
            c_permit = self.w_permit_anomaly
            p_desc = "Timber transport vehicle operating with NO registered permit"
        elif permit.status in ["EXPIRED", "REVOKED"]:
            c_permit = int(self.w_permit_anomaly * 0.85)
            p_desc = f"Timber permit status is {permit.status}"
        else:
            c_permit = 0
            p_desc = "Valid timber transport permit verified"

        # 4. Vehicle Route Anomaly (15% max weight)
        if vehicle and ("Unregistered" in vehicle.destination or "Warehouse B" in vehicle.destination or vehicle.permit_status != "VALID"):
            c_route = self.w_route_anomaly - 1  # e.g. +14
            r_desc = f"Vehicle route correlates with non-permitted destination ({vehicle.destination})"
        elif vehicle:
            c_route = int(self.w_route_anomaly * 0.40)
            r_desc = "Vehicle operating along monitored timber corridor"
        else:
            c_route = 0
            r_desc = "No associated vehicle route detected"

        # 5. Historical Risk (10% max weight)
        inc_count = len(nearby_incidents)
        if inc_count >= 5:
            c_hist = int(self.w_historical_risk * 0.80)  # +8
            h_desc = f"High-risk historical zone ({inc_count} prior illegal logging incidents)"
        elif inc_count >= 1:
            c_hist = int(self.w_historical_risk * 0.40)
            h_desc = f"Historical incident corridor ({inc_count} prior incidents)"
        else:
            c_hist = 0
            h_desc = "No prior incidents in immediate vicinity"

        # 6. Spatial Proximity (5% max weight)
        if distance_km <= 3.0:
            c_prox = int(self.w_spatial_proximity * 0.80)  # +4
            px_desc = f"High spatial correlation (vehicle within {distance_km:.1f} km of change centroid)"
        elif distance_km <= 8.0:
            c_prox = int(self.w_spatial_proximity * 0.40)
            px_desc = f"Moderate proximity ({distance_km:.1f} km)"
        else:
            c_prox = 0
            px_desc = "Distal location (> 8 km)"

        total_score = min(100, c_severity + c_veg + c_permit + c_route + c_hist + c_prox)

        if total_score >= 85:
            level = "CRITICAL"
        elif total_score >= 70:
            level = "VERY HIGH"
        elif total_score >= 50:
            level = "HIGH"
        elif total_score >= 30:
            level = "MODERATE"
        else:
            level = "LOW"

        factors = [
            RiskFactor(name="Forest Change Severity", weight_pct=self.w_change_severity, contribution=c_severity, description=c_desc),
            RiskFactor(name="Vegetation Density Loss", weight_pct=self.w_veg_loss, contribution=c_veg, description=v_desc),
            RiskFactor(name="Permit Anomaly", weight_pct=self.w_permit_anomaly, contribution=c_permit, description=p_desc),
            RiskFactor(name="Vehicle Route Anomaly", weight_pct=self.w_route_anomaly, contribution=c_route, description=r_desc),
            RiskFactor(name="Historical Risk", weight_pct=self.w_historical_risk, contribution=c_hist, description=h_desc),
            RiskFactor(name="Spatial Proximity", weight_pct=self.w_spatial_proximity, contribution=c_prox, description=px_desc),
        ]

        return RiskScoreBreakdown(
            total_score=total_score,
            risk_level=level,
            forest_change_severity=c_severity,
            veg_density_loss=c_veg,
            permit_anomaly=c_permit,
            route_anomaly=c_route,
            historical_risk=c_hist,
            spatial_proximity=c_prox,
            factors=factors
        )

risk_engine = IllegalLoggingRiskEngine()
