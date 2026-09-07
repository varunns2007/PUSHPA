import math
from typing import Dict, Any, List, Optional
from shapely.geometry import Point, LineString, Polygon
from app.database.models import Vehicle, ChangePolygon, TimberPermit

class VehicleTracker:
    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def analyze_vehicle_route(
        self,
        vehicle: Vehicle,
        change_polygons: List[ChangePolygon],
        permit: Optional[TimberPermit]
    ) -> Dict[str, Any]:
        """
        Analyzes vehicle route against forest change polygons and timber permits.
        Outputs Route Anomaly Score and spatial correlation.
        """
        min_dist_km = 999.0
        nearest_poly_id = None
        
        for poly in change_polygons:
            d = self.haversine_distance_km(
                vehicle.current_lat, vehicle.current_lng,
                poly.centroid_lat, poly.centroid_lng
            )
            if d < min_dist_km:
                min_dist_km = d
                nearest_poly_id = poly.id

        # Route Anomaly evaluation
        route_anomaly_score = 0
        reasons = []

        # Permit check
        permit_anomaly = False
        if not permit or permit.status != "VALID":
            permit_anomaly = True
            route_anomaly_score += 40
            reasons.append("Vehicle operating without valid timber transport permit")
        
        # Proximity to change event
        if min_dist_km <= 3.0:
            route_anomaly_score += 35
            reasons.append(f"Vehicle located within {min_dist_km:.2f} km of detected forest clearing polygon ({nearest_poly_id})")
        elif min_dist_km <= 8.0:
            route_anomaly_score += 15
            reasons.append(f"Vehicle on peripheral route {min_dist_km:.2f} km from change zone")

        # Off-hours or unverified destination
        if "Unregistered" in vehicle.destination or "Warehouse B" in vehicle.destination:
            route_anomaly_score += 25
            reasons.append("Vehicle heading towards unregistered non-licensed timber destination")

        route_anomaly_score = min(100, route_anomaly_score)

        return {
            "vehicle_id": vehicle.id,
            "min_distance_to_change_km": round(min_dist_km, 2),
            "nearest_polygon_id": nearest_poly_id,
            "permit_status": permit.status if permit else "NOT_FOUND",
            "route_anomaly_score": route_anomaly_score,
            "route_deviation_level": "High" if route_anomaly_score > 60 else ("Moderate" if route_anomaly_score > 30 else "Low"),
            "reasons": reasons
        }

vehicle_tracker = VehicleTracker()
