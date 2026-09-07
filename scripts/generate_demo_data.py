import json
import os
import sys
import random

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.models import (
    ForestArea, SatelliteObservation, ChangeEvent, ChangePolygon,
    HistoricalIncident, TimberPermit, Vehicle, Alert
)
from app.database.db import db

def seed_demo_data():
    print("Seeding PUSHPA demo dataset...")
    
    # 1. Forest Regions
    forest_data = [
        ("FOREST_001", "Nilgiri Biosphere Reserve (Zone A)", "NBR-A", 11.5833, 76.5500, 10420.0, 72.0, 18.0, 6.0, 4.0, 2.73, 8, 91),
        ("FOREST_002", "Wayanad Wildlife Sanctuary", "WWS-02", 11.6854, 76.3688, 8500.0, 68.0, 22.0, 7.0, 3.0, 1.45, 5, 65),
        ("FOREST_003", "Mudumalai Forest Reserve", "MFR-03", 11.5623, 76.5341, 12300.0, 75.0, 15.0, 7.0, 3.0, 0.80, 4, 45),
        ("FOREST_004", "Silent Valley National Park", "SVNP-04", 11.1324, 76.4312, 14200.0, 85.0, 10.0, 4.0, 1.0, 0.00, 1, 15),
        ("FOREST_005", "Bandipur Tiger Reserve (East)", "BTR-05", 11.6644, 76.6267, 9800.0, 70.0, 19.0, 8.0, 3.0, 1.90, 6, 72),
        ("FOREST_006", "Anamalai Forest Division", "AFD-06", 10.4851, 76.9742, 11500.0, 74.0, 18.0, 5.0, 3.0, 0.50, 3, 35),
        ("FOREST_007", "Shendurney Wildlife Sanctuary", "SWS-07", 8.9012, 77.0654, 7800.0, 80.0, 12.0, 5.0, 3.0, 0.00, 2, 20),
        ("FOREST_008", "Sathyamangalam Forest Division", "SFD-08", 11.5033, 77.2412, 15600.0, 62.0, 24.0, 10.0, 4.0, 3.10, 12, 85),
    ]

    for fid, name, code, lat, lng, area, dense, mod, sparse, non_v, loss, inc, risk in forest_data:
        coords = [
            [round(lng - 0.04, 4), round(lat - 0.04, 4)],
            [round(lng + 0.04, 4), round(lat - 0.04, 4)],
            [round(lng + 0.04, 4), round(lat + 0.04, 4)],
            [round(lng - 0.04, 4), round(lat + 0.04, 4)],
            [round(lng - 0.04, 4), round(lat - 0.04, 4)]
        ]
        fa = ForestArea(
            id=fid, name=name, code=code, center_lat=lat, center_lng=lng,
            total_area_ha=area, dense_veg_pct=dense, moderate_veg_pct=mod,
            sparse_veg_pct=sparse, non_veg_pct=non_v, recent_loss_ha=loss,
            historical_incidents_count=inc, current_risk_score=risk,
            polygon_coordinates=coords
        )
        db.forests[fa.id] = fa

    # 2. Key Demo Change Event & Polygons (PUSHPA DEMO INCIDENT)
    poly1 = ChangePolygon(
        id="CHG_POLY_001",
        forest_id="FOREST_001",
        event_id="CHG001",
        area_ha=2.73,
        centroid_lat=11.5855,
        centroid_lng=76.5520,
        mean_ndvi_before=0.76,
        mean_ndvi_after=0.31,
        ndvi_decrease=0.45,
        veg_loss_pct=59.2,
        severity="Critical",
        detection_date="2026-09-01",
        polygon_geometry=[
            [76.5505, 11.5840],
            [76.5535, 11.5840],
            [76.5535, 11.5870],
            [76.5505, 11.5870],
            [76.5505, 11.5840]
        ]
    )
    db.polygons[poly1.id] = poly1

    evt1 = ChangeEvent(
        id="CHG001",
        forest_id="FOREST_001",
        forest_name="Nilgiri Biosphere Reserve (Zone A)",
        observation_before_id="OBS_20260801",
        observation_after_id="OBS_20260901",
        date_before="2026-08-01",
        date_after="2026-09-01",
        affected_area_ha=2.73,
        severity="Critical",
        status="Needs Investigation",
        risk_score=91,
        polygons=[poly1]
    )
    db.changes[evt1.id] = evt1

    # 3. Permits
    permits_data = [
        TimberPermit(permit_id="TP_8841", vehicle_id="TN01XY9988", source_location="Licensed Forest Coupe #4", destination="State Timber Depot A", approved_area="Zone B-2", approved_quantity_m3=45.0, valid_from="2026-08-20", valid_until="2026-09-15", status="VALID"),
        TimberPermit(permit_id="TP_7723", vehicle_id="KL10CD5544", source_location="Social Forestry Block C", destination="Govt Paper Mill", approved_area="Block C", approved_quantity_m3=30.0, valid_from="2026-08-10", valid_until="2026-08-30", status="EXPIRED"),
    ]
    for p in permits_data:
        db.permits[p.permit_id] = p

    # 4. Vehicles (Including PUSHPA DEMO vehicle TN01AB1234)
    v_demo = Vehicle(
        id="VEH_001",
        vehicle_number="TN01AB1234",
        vehicle_type="Timber Hauler",
        current_lat=11.5830,
        current_lng=76.5490,
        speed_kmh=47.0,
        heading_deg=132.0,
        origin="Forest Zone A",
        destination="Unregistered Warehouse B",
        declared_quantity_m3=38.5,
        permit_id=None,
        permit_status="NOT_FOUND",
        risk_level="CRITICAL",
        route_history=[
            [11.5790, 76.5410],
            [11.5805, 76.5440],
            [11.5820, 76.5470],
            [11.5830, 76.5490]
        ]
    )
    db.vehicles[v_demo.id] = v_demo

    v_legal = Vehicle(
        id="VEH_002",
        vehicle_number="TN01XY9988",
        vehicle_type="Heavy Logging Truck",
        current_lat=11.5510,
        current_lng=76.5200,
        speed_kmh=35.0,
        heading_deg=85.0,
        origin="Licensed Forest Coupe #4",
        destination="State Timber Depot A",
        declared_quantity_m3=42.0,
        permit_id="TP_8841",
        permit_status="VALID",
        risk_level="LOW",
        route_history=[[11.5500, 76.5150], [11.5510, 76.5200]]
    )
    db.vehicles[v_legal.id] = v_legal

    # Seed 15 extra simulated vehicles
    for i in range(3, 18):
        v_extra = Vehicle(
            id=f"VEH_{i:03d}",
            vehicle_number=f"TN{random.randint(10,99)}XY{random.randint(1000,9999)}",
            vehicle_type=random.choice(["Timber Truck", "Flatbed Hauler", "Pickup Truck"]),
            current_lat=11.5000 + random.uniform(-0.15, 0.15),
            current_lng=76.5000 + random.uniform(-0.15, 0.15),
            speed_kmh=float(random.randint(20, 60)),
            heading_deg=float(random.randint(0, 359)),
            origin="Forest Station Checkpoint",
            destination="Regional Timber Yard",
            declared_quantity_m3=float(random.randint(15, 50)),
            permit_id=f"TP_{random.randint(1000,9999)}",
            permit_status="VALID",
            risk_level="LOW",
            route_history=[]
        )
        db.vehicles[v_extra.id] = v_extra

    # 5. Historical Incidents (50+ incidents)
    for i in range(1, 60):
        inc = HistoricalIncident(
            id=f"INC_{i:03d}",
            incident_date=f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            latitude=round(11.5833 + random.uniform(-0.08, 0.08), 4),
            longitude=round(76.5500 + random.uniform(-0.08, 0.08), 4),
            forest_area_id="FOREST_001" if i <= 20 else f"FOREST_{random.randint(2,8):03d}",
            forest_name="Nilgiri Biosphere Reserve" if i <= 20 else "Regional Forest Reserve",
            incident_type=random.choice(["Illegal Teak Felling", "Unpermitted Rosewood Transport", "Night Clearing", "Boundary Encroachment"]),
            estimated_quantity_m3=float(random.randint(10, 80)),
            associated_vehicle_id=f"TN01AB{random.randint(1000,9999)}",
            route_taken="Unharvested Track 4 -> Highway 181",
            status="CONFIRMED"
        )
        db.incidents[inc.id] = inc

    # 6. Critical Alert for PUSHPA DEMO INCIDENT
    alt1 = Alert(
        id="ALT_0001",
        timestamp="22:08:40",
        alert_type="Critical Correlation",
        severity="CRITICAL",
        forest_id="FOREST_001",
        forest_name="Nilgiri Biosphere Reserve (Zone A)",
        vehicle_id="VEH_001",
        location_lat=11.5830,
        location_lng=76.5490,
        title="🚨 CRITICAL INVESTIGATION ALERT: Unpermitted Timber Transport Correlated with 2.73 ha Forest Loss",
        description="Vehicle TN01AB1234 without a valid permit traversed within 2.3 km of newly extracted vegetation loss polygon CHG001 (59.2% loss).",
        risk_score=91,
        explainable_factors=[
            "+27 Forest change severity (59.2% vegetation loss)",
            "+18 Vegetation density loss (2.73 ha area)",
            "+20 Missing permit (No registered transport permit)",
            "+14 Route anomaly (Route leads to unregistered destination)",
            "+8 Historical hotspot (8 prior illegal logging incidents)",
            "+4 Spatial proximity (Vehicle within 2.3 km of clearing)"
        ],
        investigation_status="PENDING"
    )
    db.alerts.append(alt1)

    print("Demo dataset seeded successfully!")

if __name__ == "__main__":
    seed_demo_data()
