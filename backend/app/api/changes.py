from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.database.db import db
from app.database.models import ChangeEvent, ChangePolygon
from app.satellite.sentinel_client import sentinel_client
from app.satellite.ndvi import ndvi_calculator
from app.geospatial.change_detector import change_detector
from app.geospatial.polygon_extractor import polygon_extractor

router = APIRouter(prefix="/changes", tags=["Forest Changes"])

class ChangeProcessRequest(BaseModel):
    forest_id: str
    date_before: str
    date_after: str

@router.get("", response_model=List[ChangeEvent])
def get_changes(forest_id: Optional[str] = None):
    changes = list(db.changes.values())
    if forest_id:
        changes = [c for c in changes if c.forest_id == forest_id]
    return changes

@router.get("/{change_id}", response_model=ChangeEvent)
def get_change_event(change_id: str):
    if change_id not in db.changes:
        raise HTTPException(status_code=404, detail="Change event not found")
    return db.changes[change_id]

@router.post("/process", response_model=ChangeEvent)
def process_change_detection(req: ChangeProcessRequest):
    if req.forest_id not in db.forests:
        raise HTTPException(status_code=404, detail="Forest not found")
    
    forest = db.forests[req.forest_id]

    # Generate baseline (before) and degraded (after) synthetic observations
    b04_before, b08_before, _ = sentinel_client.generate_synthetic_bands(grid_size=80)
    ndvi_before = ndvi_calculator.calculate_ndvi_matrix(b04_before, b08_before)

    b04_after, b08_after, _ = sentinel_client.generate_synthetic_bands(
        grid_size=80, degradation_center=(40, 45), degradation_radius=10
    )
    ndvi_after = ndvi_calculator.calculate_ndvi_matrix(b04_after, b08_after)

    diff, stats = change_detector.calculate_ndvi_difference(ndvi_before, ndvi_after)

    poly_data_list = polygon_extractor.extract_change_polygons(
        ndvi_diff=diff,
        ndvi_before=ndvi_before,
        ndvi_after=ndvi_after,
        center_lat=forest.center_lat,
        center_lng=forest.center_lng,
        threshold=-0.20
    )

    polygons = []
    total_ha = 0.0
    for p in poly_data_list:
        cp = ChangePolygon(
            id=p["id"],
            forest_id=forest.id,
            event_id=f"EVT_{len(db.changes)+1:03d}",
            area_ha=p["area_ha"],
            centroid_lat=p["centroid_lat"],
            centroid_lng=p["centroid_lng"],
            mean_ndvi_before=p["mean_ndvi_before"],
            mean_ndvi_after=p["mean_ndvi_after"],
            ndvi_decrease=p["ndvi_decrease"],
            veg_loss_pct=p["veg_loss_pct"],
            severity=p["severity"],
            detection_date=req.date_after,
            polygon_geometry=p["polygon_geometry"]
        )
        polygons.append(cp)
        db.polygons[cp.id] = cp
        total_ha += cp.area_ha

    evt = ChangeEvent(
        id=f"EVT_{len(db.changes)+1:03d}",
        forest_id=forest.id,
        forest_name=forest.name,
        observation_before_id=f"OBS_PREV_{req.date_before}",
        observation_after_id=f"OBS_LATEST_{req.date_after}",
        date_before=req.date_before,
        date_after=req.date_after,
        affected_area_ha=round(total_ha, 2),
        severity="Critical" if stats["critical_pct"] > 0 else "High",
        status="Needs Investigation",
        risk_score=78,
        polygons=polygons
    )
    db.changes[evt.id] = evt
    forest.recent_loss_ha = evt.affected_area_ha
    return evt
