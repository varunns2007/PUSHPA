from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.database.db import db
from app.database.models import ForestArea
from app.geospatial.density_analyzer import density_analyzer
from app.satellite.sentinel_client import sentinel_client
from app.satellite.ndvi import ndvi_calculator

router = APIRouter(prefix="/forests", tags=["Forests"])

@router.get("", response_model=List[ForestArea])
def get_forests():
    return list(db.forests.values())

@router.get("/{forest_id}", response_model=ForestArea)
def get_forest(forest_id: str):
    if forest_id not in db.forests:
        raise HTTPException(status_code=404, detail="Forest area not found")
    return db.forests[forest_id]

@router.get("/{forest_id}/vegetation")
def get_forest_vegetation_stats(forest_id: str):
    if forest_id not in db.forests:
        raise HTTPException(status_code=404, detail="Forest area not found")
    
    forest = db.forests[forest_id]
    # Calculate density stats using current NDVI thresholds
    b04, b08, _ = sentinel_client.generate_synthetic_bands(grid_size=100)
    ndvi = ndvi_calculator.calculate_ndvi_matrix(b04, b08)
    stats = density_analyzer.calculate_density_stats(ndvi)
    
    return {
        "forest_id": forest.id,
        "forest_name": forest.name,
        "total_area_ha": forest.total_area_ha,
        "dense_vegetation_pct": stats["dense_pct"],
        "moderate_vegetation_pct": stats["moderate_pct"],
        "sparse_vegetation_pct": stats["sparse_pct"],
        "non_vegetation_pct": stats["non_veg_pct"],
        "recent_vegetation_loss_ha": forest.recent_loss_ha,
        "current_investigation_risk": forest.current_risk_score
    }
