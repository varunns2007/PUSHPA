import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.satellite.sentinel_client import sentinel_client
from app.satellite.ndvi import ndvi_calculator
from app.geospatial.change_detector import change_detector
from app.geospatial.polygon_extractor import polygon_extractor
from app.database.db import db
from scripts.generate_demo_data import seed_demo_data

def run_satellite_pipeline(forest_id: str = "FOREST_001"):
    print(f"Running automated Sentinel-2 satellite pipeline for {forest_id}...")
    if not db.forests:
        seed_demo_data()

    forest = db.forests.get(forest_id)
    if not forest:
        print("Forest not found!")
        return

    # Query latest Sentinel-2 metadata
    today = datetime.now().strftime("%Y-%m-%d")
    prev_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    obs_meta = sentinel_client.search_observations(
        lat=forest.center_lat,
        lng=forest.center_lng,
        start_date=prev_date,
        end_date=today,
        max_cloud_pct=20.0
    )
    print(f"Acquired Satellite Product: {obs_meta['product_id']} (Cloud cover: {obs_meta['cloud_pct']}%)")

    # Generate band matrices
    b04_before, b08_before, _ = sentinel_client.generate_synthetic_bands(grid_size=80)
    b04_after, b08_after, _ = sentinel_client.generate_synthetic_bands(
        grid_size=80, degradation_center=(40, 45), degradation_radius=10
    )

    ndvi_before = ndvi_calculator.calculate_ndvi_matrix(b04_before, b08_before)
    ndvi_after = ndvi_calculator.calculate_ndvi_matrix(b04_after, b08_after)

    diff, stats = change_detector.calculate_ndvi_difference(ndvi_before, ndvi_after)
    polygons = polygon_extractor.extract_change_polygons(
        ndvi_diff=diff,
        ndvi_before=ndvi_before,
        ndvi_after=ndvi_after,
        center_lat=forest.center_lat,
        center_lng=forest.center_lng
    )

    print(f"Extracted {len(polygons)} forest change polygon(s). Total affected area: {sum(p['area_ha'] for p in polygons):.2f} ha.")

if __name__ == "__main__":
    run_satellite_pipeline()
