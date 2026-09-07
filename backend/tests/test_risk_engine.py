import pytest
from app.risk.engine import ForestRiskEngine
from app.risk.scoring_config import RISK_WEIGHTS, RULESET_VERSION, TOTAL_MAX_SCORE
from app.database.models import ChangeEvent, ChangePolygon, Vehicle, TimberPermit, HistoricalIncident

def test_central_scoring_weights_sum():
    """Prove that weights sum to exactly 100."""
    assert TOTAL_MAX_SCORE == 100
    assert sum(RISK_WEIGHTS.values()) == 100
    assert RISK_WEIGHTS["forest_change"] == 30
    assert RISK_WEIGHTS["vegetation_loss"] == 20
    assert RISK_WEIGHTS["permit_anomaly"] == 20
    assert RISK_WEIGHTS["route_anomaly"] == 15
    assert RISK_WEIGHTS["historical_risk"] == 10
    assert RISK_WEIGHTS["spatial_proximity"] == 5

def test_risk_score_maximums():
    """Prove maximum risk score equals 100 and components match maximum weights."""
    engine = ForestRiskEngine()
    
    polygon = ChangePolygon(
        id="p1", forest_id="f1", event_id="e1", area_ha=5.0,
        centroid_lat=0.0, centroid_lng=0.0,
        mean_ndvi_before=0.8, mean_ndvi_after=0.2,
        ndvi_decrease=0.6, veg_loss_pct=75.0, severity="Critical",
        detection_date="2026-09-01", polygon_geometry=[]
    )
    change_event = ChangeEvent(
        id="e1", forest_id="f1", forest_name="Test Forest",
        observation_before_id="o1", observation_after_id="o2",
        date_before="2026-08-01", date_after="2026-09-01",
        affected_area_ha=5.0, severity="Critical", risk_score=0
    )
    change_event.polygons = [polygon]
    
    vehicle = Vehicle(
        id="v1", vehicle_number="123", vehicle_type="Truck",
        current_lat=0.0, current_lng=0.0, speed_kmh=50.0, heading_deg=0.0,
        origin="A", destination="Unregistered", declared_quantity_m3=10.0,
        permit_status="NOT_FOUND"
    )
    
    permit = TimberPermit(
        permit_id="p1", vehicle_id="v1", source_location="A",
        destination="B", approved_area="Z", approved_quantity_m3=10.0,
        valid_from="2026-01-01", valid_until="2026-12-31", status="NOT_FOUND"
    )
    
    incidents = [
        HistoricalIncident(
            id=f"i{i}", incident_date="2026-01-01", latitude=0.0, longitude=0.0,
            forest_area_id="f1", forest_name="Test Forest", incident_type="Logging",
            estimated_quantity_m3=10.0, status="CONFIRMED"
        ) for i in range(5)
    ]
    
    breakdown = engine.calculate_risk(
        change_event=change_event,
        vehicle=vehicle,
        permit=permit,
        nearby_incidents=incidents,
        distance_km=1.0  # highly proximal
    )
    
    # Assert individual components
    assert breakdown.forest_change_severity == 30
    assert breakdown.veg_density_loss == 20
    assert breakdown.permit_anomaly == 20
    assert breakdown.route_anomaly == 15
    assert breakdown.historical_risk == 10
    assert breakdown.spatial_proximity == 5
    
    # Assert components dictionary structure
    assert breakdown.components == {
        "forest_change": 30,
        "vegetation_loss": 20,
        "permit_anomaly": 20,
        "route_anomaly": 15,
        "historical_risk": 10,
        "spatial_proximity": 5
    }
    
    # Assert total and versioning
    assert breakdown.total_score == 100
    assert breakdown.risk_level == "CRITICAL"
    assert breakdown.ruleset_version == RULESET_VERSION
    assert breakdown.confidence == 100

def test_risk_score_minimums():
    """Prove minimum risk score equals 0 and component limits cannot be breached."""
    engine = ForestRiskEngine()
    
    # Valid permit, no vehicle, no clearing, no historical incidents
    permit = TimberPermit(
        permit_id="p1", vehicle_id="v1", source_location="A",
        destination="B", approved_area="Z", approved_quantity_m3=10.0,
        valid_from="2026-01-01", valid_until="2026-12-31", status="VALID"
    )
    
    breakdown = engine.calculate_risk(
        change_event=None,
        vehicle=None,
        permit=permit,
        nearby_incidents=[],
        distance_km=15.0
    )
    
    assert breakdown.forest_change_severity == 0
    assert breakdown.veg_density_loss == 0
    assert breakdown.permit_anomaly == 0
    assert breakdown.route_anomaly == 0
    assert breakdown.historical_risk == 0
    assert breakdown.spatial_proximity == 0
    assert breakdown.total_score == 0
    assert breakdown.risk_level == "LOW"

def test_components_cannot_exceed_limits():
    """Verify that even with extreme inputs, individual factors never exceed their defined max."""
    engine = ForestRiskEngine()
    
    polygon = ChangePolygon(
        id="p1", forest_id="f1", event_id="e1", area_ha=500.0,
        centroid_lat=0.0, centroid_lng=0.0,
        mean_ndvi_before=1.0, mean_ndvi_after=-1.0,
        ndvi_decrease=2.0, veg_loss_pct=200.0, severity="Critical",
        detection_date="2026-09-01", polygon_geometry=[]
    )
    change_event = ChangeEvent(
        id="e1", forest_id="f1", forest_name="Test Forest",
        observation_before_id="o1", observation_after_id="o2",
        date_before="2026-08-01", date_after="2026-09-01",
        affected_area_ha=500.0, severity="Critical", risk_score=0
    )
    change_event.polygons = [polygon]
    
    vehicle = Vehicle(
        id="v1", vehicle_number="123", vehicle_type="Truck",
        current_lat=0.0, current_lng=0.0, speed_kmh=50.0, heading_deg=0.0,
        origin="A", destination="Unregistered Warehouse B", declared_quantity_m3=100.0,
        permit_status="NOT_FOUND", route_deviation_km=500.0
    )
    
    permit = TimberPermit(
        permit_id="p1", vehicle_id="v1", source_location="A",
        destination="B", approved_area="Z", approved_quantity_m3=10.0,
        valid_from="2026-01-01", valid_until="2026-12-31", status="NOT_FOUND"
    )
    
    incidents = [
        HistoricalIncident(
            id=f"i{i}", incident_date="2026-01-01", latitude=0.0, longitude=0.0,
            forest_area_id="f1", forest_name="Test Forest", incident_type="Logging",
            estimated_quantity_m3=10.0, status="CONFIRMED"
        ) for i in range(50)
    ]
    
    breakdown = engine.calculate_risk(
        change_event=change_event,
        vehicle=vehicle,
        permit=permit,
        nearby_incidents=incidents,
        distance_km=0.01
    )
    
    assert breakdown.forest_change_severity <= RISK_WEIGHTS["forest_change"]
    assert breakdown.veg_density_loss <= RISK_WEIGHTS["vegetation_loss"]
    assert breakdown.permit_anomaly <= RISK_WEIGHTS["permit_anomaly"]
    assert breakdown.route_anomaly <= RISK_WEIGHTS["route_anomaly"]
    assert breakdown.historical_risk <= RISK_WEIGHTS["historical_risk"]
    assert breakdown.spatial_proximity <= RISK_WEIGHTS["spatial_proximity"]
    assert breakdown.total_score <= 100
