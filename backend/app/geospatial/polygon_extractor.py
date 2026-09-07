import numpy as np
import cv2
import math
from typing import List, Dict, Any, Tuple, Optional
from shapely.geometry import Polygon, MultiPolygon, shape
from shapely.validation import make_valid
import pyproj
from app.config import settings

class PolygonExtractor:
    @staticmethod
    def extract_change_polygons(
        ndvi_diff: np.ndarray,
        ndvi_before: np.ndarray,
        ndvi_after: np.ndarray,
        center_lat: float,
        center_lng: float,
        threshold: float = -0.20,
        pixel_size_meters: float = 10.0,  # Sentinel-2 10m resolution
        min_area_ha: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Converts significant change pixels into valid geographic polygons with metric area calculation.
        NDVI Difference -> Threshold -> Binary Mask -> Morphological Cleanup -> Connected Components ->
        Polygonization -> Geometry Validation/Repair -> Projected Geodesic Area Calculation.
        """
        min_ha = min_area_ha if min_area_ha is not None else settings.MIN_DISTURBANCE_AREA_HA

        # Step 1 & 2: Threshold & Binary Mask (Vegetation loss = negative difference)
        binary_mask = (ndvi_diff <= threshold).astype(np.uint8) * 255

        # Step 3: Morphological Cleanup (Opening removes noise, Closing seals micro-gaps)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        clean_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel)

        # Step 4: Connected Components & Contours
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        grid_rows, grid_cols = ndvi_diff.shape
        
        # Geodetic degree delta per pixel using WGS84 standard approximations
        lat_rad = math.radians(center_lat)
        meters_per_deg_lat = 111132.954 - 559.822 * math.cos(2 * lat_rad) + 1.175 * math.cos(4 * lat_rad)
        meters_per_deg_lng = 111412.84 * math.cos(lat_rad) - 93.5 * math.cos(3 * lat_rad)

        lat_span = (grid_rows * pixel_size_meters) / meters_per_deg_lat
        lng_span = (grid_cols * pixel_size_meters) / meters_per_deg_lng

        top_lat = center_lat + (lat_span / 2.0)
        left_lng = center_lng - (lng_span / 2.0)

        # Setup projected CRS transformer for exact metric area calculation (Azimuthal Equidistant centered on AOI)
        proj_wgs84 = pyproj.CRS("EPSG:4326")
        proj_aeqd = pyproj.CRS(f"+proj=aeqd +lat_0={center_lat} +lon_0={center_lng} +datum=WGS84 +units=m")
        transformer_to_proj = pyproj.Transformer.from_crs(proj_wgs84, proj_aeqd, always_xy=True).transform

        polygons_data = []
        for idx, cnt in enumerate(contours):
            if cv2.contourArea(cnt) < 4:  # Filter out single-pixel spikes
                continue

            # Convert pixel coordinates to geographic lat/lng [[lng, lat], ...]
            geo_coords = []
            cnt_squeezed = cnt.squeeze()
            if cnt_squeezed.ndim == 1:
                cnt_squeezed = np.array([cnt_squeezed])

            for pt in cnt_squeezed:
                px_x, px_y = float(pt[0]), float(pt[1])
                lng = left_lng + (px_x / grid_cols) * lng_span
                lat = top_lat - (px_y / grid_rows) * lat_span
                geo_coords.append((round(lng, 6), round(lat, 6)))

            if len(geo_coords) < 3:
                continue

            # Ensure closed ring
            if geo_coords[0] != geo_coords[-1]:
                geo_coords.append(geo_coords[0])

            # Construct and validate Shapely geometry
            try:
                raw_poly = Polygon(geo_coords)
                if not raw_poly.is_valid:
                    valid_geom = make_valid(raw_poly)
                    if valid_geom.is_empty:
                        continue
                    if isinstance(valid_geom, MultiPolygon):
                        poly = max(valid_geom.geoms, key=lambda g: g.area)
                    else:
                        poly = valid_geom
                else:
                    poly = raw_poly

                # Calculate true planar geodesic metric area
                projected_poly = pyproj.ops.transform(transformer_to_proj, poly)
                area_sq_m = float(projected_poly.area)
                area_ha = round(area_sq_m / 10000.0, 4)

                # Filter out tiny disturbance candidates below minimum threshold
                if area_ha < min_ha:
                    continue

                # Simplify geometry slightly for lightweight GeoJSON serialization
                simplified_poly = poly.simplify(tolerance=0.00005, preserve_topology=True)
                export_coords = [[round(p[0], 6), round(p[1], 6)] for p in simplified_poly.exterior.coords]

            except Exception:
                # Fallback to pixel summation if topology fails
                comp_pixels = cv2.drawContours(np.zeros_like(clean_mask), [cnt], -1, 255, -1) > 0
                area_sq_m = float(np.sum(comp_pixels) * (pixel_size_meters ** 2))
                area_ha = round(area_sq_m / 10000.0, 4)
                if area_ha < min_ha:
                    continue
                export_coords = [[p[0], p[1]] for p in geo_coords]

            # Calculate raster statistics inside component mask
            mask_component = np.zeros_like(clean_mask)
            cv2.drawContours(mask_component, [cnt], -1, 255, -1)
            comp_pixels = mask_component > 0

            mean_before = float(np.mean(ndvi_before[comp_pixels])) if np.any(comp_pixels) else 0.70
            mean_after = float(np.mean(ndvi_after[comp_pixels])) if np.any(comp_pixels) else 0.30
            decrease = float(mean_before - mean_after)
            veg_loss_pct = float((decrease / max(0.01, mean_before)) * 100.0)

            # Centroid
            centroid_lng = round(float(poly.centroid.x if 'poly' in locals() else np.mean([pt[0] for pt in export_coords])), 6)
            centroid_lat = round(float(poly.centroid.y if 'poly' in locals() else np.mean([pt[1] for pt in export_coords])), 6)

            severity = "Critical" if veg_loss_pct > 50 else ("High" if veg_loss_pct > 35 else "Moderate")

            polygons_data.append({
                "id": f"CHG_POLY_{len(polygons_data)+1:03d}",
                "area_ha": round(area_ha, 2),
                "area_sq_m": round(area_sq_m, 1),
                "centroid_lat": centroid_lat,
                "centroid_lng": centroid_lng,
                "mean_ndvi_before": round(mean_before, 3),
                "mean_ndvi_after": round(mean_after, 3),
                "ndvi_decrease": round(decrease, 3),
                "veg_loss_pct": round(veg_loss_pct, 1),
                "severity": severity,
                "polygon_geometry": export_coords
            })

        return polygons_data

polygon_extractor = PolygonExtractor()
