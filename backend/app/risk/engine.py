from typing import Dict, Any, List, Optional
from app.database.models import RiskScoreBreakdown, RiskFactor, ChangeEvent, Vehicle, TimberPermit, HistoricalIncident
from app.risk.scoring_config import RISK_WEIGHTS, ROUTE_RISK_RULES, RULESET_VERSION, RISK_LEVEL_THRESHOLDS

class ForestRiskEngine:
    def __init__(self):
        # Configurable factor weights (%) from central configuration
        self.weights = RISK_WEIGHTS
        self.w_change_severity = self.weights["forest_change"]
        self.w_veg_loss = self.weights["vegetation_loss"]
        self.w_permit_anomaly = self.weights["permit_anomaly"]
        self.w_route_anomaly = self.weights["route_anomaly"]
        self.w_historical_risk = self.weights["historical_risk"]
        self.w_spatial_proximity = self.weights["spatial_proximity"]
        self.route_risk_rules = ROUTE_RISK_RULES
        self.ruleset_version = RULESET_VERSION

    def calculate_risk(
        self,
        change_event: Optional[ChangeEvent] = None,
        vehicle: Optional[Vehicle] = None,
        permit: Optional[TimberPermit] = None,
        nearby_incidents: List[HistoricalIncident] = [],
        distance_km: float = 2.5
    ) -> RiskScoreBreakdown:
        
        # 1. Forest Change Severity (max 30)
        change_pct = change_event.polygons[0].veg_loss_pct if (change_event and change_event.polygons) else 0.0
        if change_pct >= 50.0:
            c_severity = self.w_change_severity
            c_desc = f"Critical vegetation disturbance ({change_pct:.1f}%) detected in satellite AOI"
        elif change_pct >= 30.0:
            c_severity = int(self.w_change_severity * 0.75)
            c_desc = f"Significant vegetation decline ({change_pct:.1f}%)"
        elif change_pct >= 15.0:
            c_severity = int(self.w_change_severity * 0.40)
            c_desc = f"Moderate vegetation drop ({change_pct:.1f}%)"
        else:
            c_severity = 0
            c_desc = "Minor or baseline vegetation variation"

        # 2. Vegetation Density Loss Area (max 20)
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

        # 3. Permit Anomaly (max 20)
        # UNKNOWN does not penalize risk; only confirmed NOT_FOUND or EXPIRED/REVOKED
        if not permit or permit.status == "UNKNOWN":
            c_permit = 0
            p_desc = "Permit status is UNKNOWN (Service unavailable or missing data - no penalty added)"
        elif permit.status == "NOT_FOUND":
            c_permit = self.w_permit_anomaly
            p_desc = "Timber transport vehicle operating with NO registered permit (NOT_FOUND)"
        elif permit.status in ["EXPIRED", "REVOKED"]:
            c_permit = int(self.w_permit_anomaly * 0.85)
            p_desc = f"Timber permit status is {permit.status}"
        else:
            c_permit = 0
            p_desc = "Valid timber transport permit verified"

        # 4. Vehicle Route Anomaly (max 15)
        if vehicle:
            deviation_km = getattr(vehicle, 'route_deviation_km', 0.0) or 0.0
            
            if "Unregistered" in vehicle.destination or "Warehouse B" in vehicle.destination or vehicle.permit_status != "VALID":
                c_route = self.route_risk_rules["destination_mismatch"]
                r_desc = f"Vehicle route correlates with non-permitted destination ({vehicle.destination})"
            elif deviation_km > 10.0:
                c_route = self.route_risk_rules["major_deviation"]
                r_desc = f"Major route deviation detected ({deviation_km:.1f} km off corridor)"
            elif deviation_km > 2.0:
                c_route = self.route_risk_rules["minor_deviation"]
                r_desc = f"Minor route deviation detected ({deviation_km:.1f} km off corridor)"
            elif not vehicle.route_history:
                c_route = self.route_risk_rules["unknown_route"]
                r_desc = "Vehicle route history is unknown or missing"
            else:
                c_route = self.route_risk_rules["on_corridor"]
                r_desc = "Vehicle operating legitimately along monitored timber corridor"
        else:
            c_route = 0
            r_desc = "No associated vehicle route detected"

        # 5. Historical Risk (max 10)
        inc_count = len(nearby_incidents)
        if inc_count >= 5:
            c_hist = self.w_historical_risk
            h_desc = f"High-risk historical zone ({inc_count} prior unauthorized clearing incidents)"
        elif inc_count >= 1:
            c_hist = int(self.w_historical_risk * 0.40)
            h_desc = f"Historical incident corridor ({inc_count} prior incidents)"
        else:
            c_hist = 0
            h_desc = "No prior incidents in immediate vicinity"

        # 6. Spatial Proximity (max 5)
        if distance_km <= 3.0:
            c_prox = self.w_spatial_proximity
            px_desc = f"High spatial correlation (vehicle within {distance_km:.1f} km of change centroid)"
        elif distance_km <= 8.0:
            c_prox = int(self.w_spatial_proximity * 0.40)
            px_desc = f"Moderate proximity ({distance_km:.1f} km)"
        else:
            c_prox = 0
            px_desc = "Distal location (> 8 km)"

        # Enforce component limits
        c_severity = min(self.w_change_severity, max(0, c_severity))
        c_veg = min(self.w_veg_loss, max(0, c_veg))
        c_permit = min(self.w_permit_anomaly, max(0, c_permit))
        c_route = min(self.w_route_anomaly, max(0, c_route))
        c_hist = min(self.w_historical_risk, max(0, c_hist))
        c_prox = min(self.w_spatial_proximity, max(0, c_prox))

        raw_total = c_severity + c_veg + c_permit + c_route + c_hist + c_prox
        total_score = min(100, max(0, raw_total))

        # Risk level determination
        if total_score >= RISK_LEVEL_THRESHOLDS["CRITICAL"]:
            level = "CRITICAL"
        elif total_score >= RISK_LEVEL_THRESHOLDS["VERY HIGH"]:
            level = "VERY HIGH"
        elif total_score >= RISK_LEVEL_THRESHOLDS["HIGH"]:
            level = "HIGH"
        elif total_score >= RISK_LEVEL_THRESHOLDS["MODERATE"]:
            level = "MODERATE"
        else:
            level = "LOW"
            
        # Confidence Calculation
        base_confidence = 100
        if not permit or permit.status == "UNKNOWN":
            base_confidence -= 15  # Missing critical permit data decreases confidence, not risk
        
        if not vehicle:
            base_confidence -= 10  # Missing vehicle telemetry correlation
            
        if change_event and change_event.polygons and change_event.polygons[0].area_ha < 0.1:
            base_confidence -= 5   # Very small polygon, harder to confirm
            
        final_confidence = min(100, max(0, base_confidence))

        components = {
            "forest_change": c_severity,
            "vegetation_loss": c_veg,
            "permit_anomaly": c_permit,
            "route_anomaly": c_route,
            "historical_risk": c_hist,
            "spatial_proximity": c_prox,
        }

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
            components=components,
            factors=factors,
            ruleset_version=self.ruleset_version,
            confidence=final_confidence
        )

risk_engine = ForestRiskEngine()
