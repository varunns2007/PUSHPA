import numpy as np
import requests
from typing import Dict, Any, Tuple, Optional
from datetime import datetime
import math

class SentinelClient:
    def __init__(self, client_id: str = "", client_secret: str = ""):
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
        self.opensearch_url = "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel2/search.json"

    def search_observations(
        self, lat: float, lng: float, start_date: str, end_date: str, max_cloud_pct: float = 20.0
    ) -> Dict[str, Any]:
        """
        Search Copernicus Sentinel-2 Level-2A metadata.
        Falls back to realistic synthetic Sentinel-2 metadata if API key missing or unreachable.
        """
        try:
            if self.client_id and self.client_secret:
                params = {
                    "lat": lat,
                    "lon": lng,
                    "startDate": start_date,
                    "completionDate": end_date,
                    "maxRecords": 5,
                    "cloudCover": f"[0,{max_cloud_pct}]"
                }
                res = requests.get(self.opensearch_url, params=params, timeout=5)
                if res.status_code == 200:
                    data = res.json()
                    features = data.get("features", [])
                    if features:
                        f = features[0]
                        props = f.get("properties", {})
                        return {
                            "source": "REAL_COPERNICUS_API",
                            "product_id": f.get("id", "S2A_MSIL2A_REAL"),
                            "satellite": props.get("platform", "Sentinel-2A"),
                            "acquisition_date": props.get("startDate", end_date),
                            "cloud_pct": props.get("cloudCover", max_cloud_pct / 2.0),
                            "bands_available": ["B04", "B08", "SCL"]
                        }
        except Exception:
            pass

        # Fallback to authentic synthetic Sentinel-2 observation record
        return {
            "source": "SIMULATED_SENTINEL2",
            "product_id": f"S2B_MSIL2A_{start_date[:10].replace('-','')}_T43PFS_N0500",
            "satellite": "Sentinel-2B Level-2A",
            "acquisition_date": end_date,
            "cloud_pct": round(min(max_cloud_pct, 4.2), 1),
            "bands_available": ["B04", "B08", "SCL"]
        }

    def generate_synthetic_bands(
        self, grid_size: int = 100, degradation_center: Optional[Tuple[int, int]] = None, degradation_radius: int = 12
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generates realistic 2D numpy matrices for Red (B04), NIR (B08), and Scene Classification (SCL).
        degradation_center: (r, c) pixel coordinate to inject forest loss clearing.
        """
        np.random.seed(42)
        # Base vegetation NIR high (0.5 to 0.75), Red low (0.05 to 0.15)
        base_b04 = 0.08 + np.random.normal(0, 0.015, (grid_size, grid_size))
        base_b08 = 0.62 + np.random.normal(0, 0.03, (grid_size, grid_size))
        
        # Terrain / elevation gradient variation
        x = np.linspace(-3, 3, grid_size)
        y = np.linspace(-3, 3, grid_size)
        xx, yy = np.meshgrid(x, y)
        elevation_texture = np.sin(xx) * np.cos(yy) * 0.05
        base_b08 += elevation_texture
        
        # SCL: 4 = Vegetation, 3 = Shadow, 8 = Cloud
        scl = np.full((grid_size, grid_size), 4, dtype=int)

        if degradation_center is not None:
            cr, cc = degradation_center
            rr, cc_mesh = np.ogrid[:grid_size, :grid_size]
            dist_sq = (rr - cr) ** 2 + (cc_mesh - cc) ** 2
            mask = dist_sq <= (degradation_radius ** 2)
            
            # Forest clearing: Red increases (exposed soil/road 0.25-0.35), NIR drops (0.20-0.30)
            base_b04[mask] = 0.32 + np.random.normal(0, 0.02, np.sum(mask))
            base_b08[mask] = 0.22 + np.random.normal(0, 0.02, np.sum(mask))

        base_b04 = np.clip(base_b04, 0.01, 0.99)
        base_b08 = np.clip(base_b08, 0.01, 0.99)
        
        return base_b04, base_b08, scl

sentinel_client = SentinelClient()
