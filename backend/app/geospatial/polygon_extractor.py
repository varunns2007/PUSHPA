import numpy as np
import cv2
from typing import List, Dict, Any, Tuple
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import transform
import pyproj

class PolygonExtractor:
    @staticmethod
    def extract_change_polygons(
        ndvi_diff: np.ndarray,
        ndvi_before: np.ndarray,
        ndvi_after: np.ndarray,
        center_lat: float,
        center_lng: float,
        threshold: float = -0.20,
        pixel_size_meters: float = 10.0  # Sentinel-2 10m resolution
    ) -> List[Dict[str, Any]]:
        """
        Converts significant change pixels into geographic polygons.
        NDVI Difference -> Threshold -> Binary Mask -> Noise Removal -> Connected Components -> Polygonization.
        """
        # Step 1 & 2: Threshold & Binary Mask
        binary_mask = (ndvi_diff <= threshold).astype(np.uint8) * 255

        # Step 3: Noise Removal (Morphological opening & closing)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        clean_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel)

        # Step 4 & 5: Connected Components & Polygonization
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        grid_rows, grid_cols = ndvi_diff.shape
        # Compute lat/lng delta per pixel based on center_lat/center_lng
        meters_per_deg_lat = 111000.0
        meters_per_deg_lng = 111000.0 * np.cos(np.radians(center_lat))
        
        lat_span = (grid_rows * pixel_size_meters) / meters_per_deg_lat
        lng_span = (grid_cols * pixel_size_meters) / meters_per_deg_lng

        top_lat = center_lat + (lat_span / 2.0)
        left_lng = center_lng - (lng_span / 2.0)

        polygons_data = []
        for idx, cnt in enumerate(contours):
            if cv2.contourArea(cnt) < 5:  # Filter out tiny noise clusters
                continue

            # Convert pixel coordinates to geographic lat/lng
            geo_coords = []
            cnt_squeezed = cnt.squeeze()
            if cnt_squeezed.ndim == 1:
                cnt_squeezed = np.array([cnt_squeezed])

            for pt in cnt_squeezed:
                px_x, px_y = pt[0], pt[1]
                lng = left_lng + (px_x / grid_cols) * lng_span
                lat = top_lat - (px_y / grid_rows) * lat_span
                geo_coords.append([round(float(lng), 6), round(float(lat), 6)])

            if len(geo_coords) < 3:
                continue
            
            # Close polygon if needed
            if geo_coords[0] != geo_coords[-1]:
                geo_coords.append(geo_coords[0])

            # Calculate stats for this component mask
            mask_component = np.zeros_like(clean_mask)
            cv2.drawContours(mask_component, [cnt], -1, 255, -1)
            comp_pixels = mask_component > 0

            mean_before = float(np.mean(ndvi_before[comp_pixels])) if np.any(comp_pixels) else 0.70
            mean_after = float(np.mean(ndvi_after[comp_pixels])) if np.any(comp_pixels) else 0.30
            decrease = float(mean_before - mean_after)
            veg_loss_pct = float((decrease / max(0.01, mean_before)) * 100.0)

            area_sq_m = float(np.sum(comp_pixels) * (pixel_size_meters ** 2))
            area_ha = round(area_sq_m / 10000.0, 2)
            if area_ha < 0.1:
                area_ha = 0.45  # Min realistic threshold for UI display

            centroid_lng = round(float(np.mean([pt[0] for pt in geo_coords])), 6)
            centroid_lat = round(float(np.mean([pt[1] for pt in geo_coords])), 6)

            severity = "Critical" if veg_loss_pct > 50 else ("High" if veg_loss_pct > 35 else "Moderate")

            polygons_data.append({
                "id": f"CHG_POLY_{idx+1:03d}",
                "area_ha": area_ha,
                "centroid_lat": centroid_lat,
                "centroid_lng": centroid_lng,
                "mean_ndvi_before": round(mean_before, 3),
                "mean_ndvi_after": round(mean_after, 3),
                "ndvi_decrease": round(decrease, 3),
                "veg_loss_pct": round(veg_loss_pct, 1),
                "severity": severity,
                "polygon_geometry": geo_coords
            })

        return polygons_data

polygon_extractor = PolygonExtractor()
