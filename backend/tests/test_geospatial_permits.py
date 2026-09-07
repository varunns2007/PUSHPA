import numpy as np
import pytest
from app.geospatial.polygon_extractor import polygon_extractor
from app.vehicles.tracker import vehicle_tracker
from app.permits.validator import permit_validator
from app.database.models import Vehicle, TimberPermit, ChangePolygon
from datetime import datetime

def test_polygon_extractor_geodesic_area():
    """Verify that polygon extractor returns valid polygons with metric area."""
    grid_size = 60
    ndvi_before = np.full((grid_size, grid_size), 0.75)
    ndvi_after = np.full((grid_size, grid_size), 0.75)
    
    # Inject 15x15 clearing
    ndvi_after[20:35, 20:35] = 0.20
    ndvi_diff = ndvi_after - ndvi_before

    polys = polygon_extractor.extract_change_polygons(
        ndvi_diff=ndvi_diff,
        ndvi_before=ndvi_before,
        ndvi_after=ndvi_after,
        center_lat=11.58,
        center_lng=76.55,
        threshold=-0.20,
        min_area_ha=0.05
    )

    assert len(polys) >= 1
    p = polys[0]
    assert p["area_ha"] > 0.05
    assert p["veg_loss_pct"] > 50.0
    assert p["severity"] == "Critical"
    assert len(p["polygon_geometry"]) >= 4

def test_vehicle_tracker_boundary_distance():
    """Test point-to-polygon minimum boundary distance calculation."""
    poly_coords = [
        [76.50, 11.50],
        [76.52, 11.50],
        [76.52, 11.52],
        [76.50, 11.52],
        [76.50, 11.50]
    ]
    
    # Point inside polygon
    d_inside = vehicle_tracker.min_distance_to_polygon_m(11.51, 76.51, poly_coords)
    assert d_inside == 0.0

    # Point outside polygon
    d_outside = vehicle_tracker.min_distance_to_polygon_m(11.60, 76.51, poly_coords)
    assert d_outside > 5000.0

def test_permit_validation_temporal_and_status():
    """Test permit validator for temporal window, status, and identity mapping."""
    vehicle = Vehicle(
        id="v1", vehicle_number="TN01AB1234", vehicle_type="Truck",
        current_lat=11.58, current_lng=76.55, speed_kmh=40.0, heading_deg=90.0,
        origin="Coupe 1", destination="Depot A", declared_quantity_m3=20.0,
        permit_id="p1", permit_status="VALID"
    )

    # 1. Active valid permit
    permit_valid = TimberPermit(
        permit_id="p1", vehicle_id="TN01AB1234", source_location="Coupe 1",
        destination="Depot A", approved_area="Zone 1", approved_quantity_m3=20.0,
        valid_from="2026-01-01", valid_until="2026-12-31", status="VALID"
    )
    res_valid = permit_validator.validate_permit(permit_valid, vehicle, check_datetime=datetime(2026, 6, 1))
    assert res_valid["is_valid"] is True
    assert res_valid["status"] == "VALID"

    # 2. Expired permit
    permit_expired = TimberPermit(
        permit_id="p2", vehicle_id="TN01AB1234", source_location="Coupe 1",
        destination="Depot A", approved_area="Zone 1", approved_quantity_m3=20.0,
        valid_from="2026-01-01", valid_until="2026-05-01", status="VALID"
    )
    res_exp = permit_validator.validate_permit(permit_expired, vehicle, check_datetime=datetime(2026, 6, 1))
    assert res_exp["is_valid"] is False
    assert res_exp["status"] == "EXPIRED"

    # 3. Vehicle mismatch
    permit_mismatch = TimberPermit(
        permit_id="p3", vehicle_id="OTHER_TRUCK_999", source_location="Coupe 1",
        destination="Depot A", approved_area="Zone 1", approved_quantity_m3=20.0,
        valid_from="2026-01-01", valid_until="2026-12-31", status="VALID"
    )
    res_mismatch = permit_validator.validate_permit(permit_mismatch, vehicle, check_datetime=datetime(2026, 6, 1))
    assert res_mismatch["is_valid"] is False
    assert res_mismatch["status"] == "VEHICLE_MISMATCH"

    # 4. UNKNOWN state (e.g. timeout)
    permit_unknown = TimberPermit(
        permit_id="p4", vehicle_id="TN01AB1234", source_location="Coupe 1",
        destination="Depot A", approved_area="Zone 1", approved_quantity_m3=20.0,
        valid_from="2026-01-01", valid_until="2026-12-31", status="UNKNOWN"
    )
    res_unknown = permit_validator.validate_permit(permit_unknown, vehicle)
    assert res_unknown["status"] == "UNKNOWN"
    assert res_unknown["confidence_impact"] == -15
