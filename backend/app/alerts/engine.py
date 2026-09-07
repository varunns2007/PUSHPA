from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.models import Alert
from app.database.db import db

class AlertEngine:
    def create_alert(
        self,
        alert_type: str,
        severity: str,
        forest_id: str,
        forest_name: str,
        title: str,
        description: str,
        risk_score: int,
        explainable_factors: List[str],
        vehicle_id: Optional[str] = None,
        lat: float = 11.58,
        lng: float = 76.55
    ) -> Alert:
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
            explainable_factors=explainable_factors,
            investigation_status="PENDING"
        )
        db.alerts.insert(0, alert)
        if len(db.alerts) > 100:
            db.alerts.pop()
        return alert

alert_engine = AlertEngine()
