from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.satellite.sentinel_client import sentinel_client
from app.satellite.ndvi import ndvi_calculator
from app.geospatial.density_analyzer import density_analyzer
from app.database.db import db
from app.database.models import SatelliteObservation

router = APIRouter(prefix="/satellite", tags=["Satellite"])

class SatelliteSearchRequest(BaseModel):
    forest_id: str
    latitude: float
    longitude: float
    start_date: str
    end_date: str
    max_cloud_pct: float = 20.0

@router.post("/search")
def search_satellite_imagery(req: SatelliteSearchRequest):
    result = sentinel_client.search_observations(
        lat=req.latitude,
        lng=req.longitude,
        start_date=req.start_date,
        end_date=req.end_date,
        max_cloud_pct=req.max_cloud_pct
    )
    
    # Generate synthetic band sample statistics
    b04, b08, _ = sentinel_client.generate_synthetic_bands(grid_size=100)
    ndvi = ndvi_calculator.calculate_ndvi_matrix(b04, b08)
    metrics = ndvi_calculator.calculate_metrics(ndvi)
    
    obs = SatelliteObservation(
        id=f"OBS_{len(db.observations)+1:03d}",
        forest_id=req.forest_id,
        satellite_name=result["satellite"],
        product_id=result["product_id"],
        acquisition_date=result["acquisition_date"],
        cloud_coverage_pct=result["cloud_pct"],
        aoi_name=f"Forest Zone ({req.latitude:.2f}, {req.longitude:.2f})",
        min_ndvi=metrics["min_ndvi"],
        max_ndvi=metrics["max_ndvi"],
        mean_ndvi=metrics["mean_ndvi"],
        median_ndvi=metrics["median_ndvi"],
        vegetation_coverage_pct=metrics["vegetation_coverage_pct"],
        processing_timestamp=datetime.now().isoformat()
    )
    db.observations[obs.id] = obs
    return obs

@router.get("/observations", response_model=List[SatelliteObservation])
def get_observations(forest_id: Optional[str] = None):
    obs_list = list(db.observations.values())
    if forest_id:
        obs_list = [o for o in obs_list if o.forest_id == forest_id]
    return obs_list

@router.get("/ndvi/{forest_id}")
def get_ndvi_raster(forest_id: str, date: Optional[str] = None):
    if forest_id not in db.forests:
        raise HTTPException(status_code=404, detail="Forest area not found")
    
    forest = db.forests[forest_id]
    b04, b08, _ = sentinel_client.generate_synthetic_bands(grid_size=60)
    ndvi = ndvi_calculator.calculate_ndvi_matrix(b04, b08)
    metrics = ndvi_calculator.calculate_metrics(ndvi)
    
    # Convert matrix to lightweight JSON grid for UI visualization
    ndvi_grid = ndvi.tolist()
    return {
        "forest_id": forest_id,
        "forest_name": forest.name,
        "date": date or datetime.now().strftime("%Y-%m-%d"),
        "grid_shape": list(ndvi.shape),
        "metrics": metrics,
        "ndvi_grid": ndvi_grid
    }
