import math
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.models import Alert
from app.database.db import db
from app.config import settings

class AlertEngine:
    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def find_duplicate_alert(
        self, forest_id: str, lat: float, lng: float, distance_km_thresh: Optional[float] = None
    ) -> Optional[Alert]:
        """
        Deduplication check (Phase 22 requirement):
        Finds active pending alert for the same spatial region and forest.
        """
        thresh = distance_km_thresh if distance_km_thresh is not None else settings.ALERT_DEDUP_DISTANCE_KM
        for existing in db.alerts:
            if existing.forest_id == forest_id and existing.investigation_status in ["PENDING", "FIELD_VERIFICATION"]:
                d = self._haversine_km(lat, lng, existing.location_lat, existing.location_lng)
                if d <= thresh:
                    return existing
        return None

    def create_or_update_alert(
        self,
        alert_type: str,
        severity: str,
        forest_id: str,
        forest_name: str,
        title: str,
        description: str,
        risk_score: int,
        confidence: int,
        explainable_factors: List[str],
        vehicle_id: Optional[str] = None,
        lat: float = 11.58,
        lng: float = 76.55,
        event_id: Optional[str] = None
    ) -> Alert:
        """
        Creates new alert or updates existing active alert to prevent duplicate alert spamming.
        """
        existing = self.find_duplicate_alert(forest_id, lat, lng)
        if existing:
            # Update existing alert with latest telemetry & risk score
            existing.risk_score = max(existing.risk_score, risk_score)
            existing.confidence = confidence
            existing.description = f"{description} [Updated at {datetime.now().strftime('%H:%M:%S')}]"
            existing.explainable_factors = explainable_factors
            if vehicle_id:
                existing.vehicle_id = vehicle_id
            return existing

        alert_id = f"ALT_{len(db.alerts) + 1:04d}"
        alert = Alert(
            id=alert_id,
            timestamp=datetime.now().strftime("%H:%M:%S"),
            alert_type=alert_type,
            severity=severity,
            forest_id=forest_id,
            forest_name=forest_name,
            vehicle_id=vehicle_id,
            location_lat=lat,
            location_lng=lng,
            title=title,
            description=description,
            risk_score=risk_score,
            confidence=confidence,
            explainable_factors=explainable_factors,
            investigation_status="PENDING",
            event_id=event_id,
            ruleset_version="v1.0"
        )
        db.alerts.insert(0, alert)
        if len(db.alerts) > 100:
            db.alerts.pop()
        return alert

alert_engine = AlertEngine()
