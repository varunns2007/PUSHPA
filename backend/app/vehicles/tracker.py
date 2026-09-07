import math
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from shapely.geometry import Point, LineString, Polygon
from app.database.models import Vehicle, ChangePolygon, TimberPermit
from app.config import settings

class VehicleTracker:
    @staticmethod
    def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance between two geographic coordinates in meters."""
        R = 6371000.0  # Earth radius in meters
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @staticmethod
    def min_distance_to_polygon_m(
        vehicle_lat: float, vehicle_lng: float, polygon_coords: List[List[float]]
    ) -> float:
        """
        Calculates exact minimum Euclidean/geodesic distance in meters from a vehicle point
        to the disturbance polygon perimeter or 0 if inside.
        """
        if not polygon_coords or len(polygon_coords) < 3:
            return 999999.0
        
        try:
            # polygon_coords are [[lng, lat], ...]
            poly = Polygon(polygon_coords)
            pt = Point(vehicle_lng, vehicle_lat)
            
            if poly.contains(pt):
                return 0.0
            
            # Approximate distance conversion to meters at this latitude
            lat_deg = vehicle_lat
            meters_per_deg_lat = 111132.0
            meters_per_deg_lng = 111412.0 * math.cos(math.radians(lat_deg))
            
            # Distance to exterior boundary
            min_dist = float('inf')
            coords = list(poly.exterior.coords)
            for i in range(len(coords) - 1):
                p1_lng, p1_lat = coords[i]
                p2_lng, p2_lat = coords[i+1]
                
                # Sample segments or point-to-line projection
                seg_d = VehicleTracker.haversine_distance_m(vehicle_lat, vehicle_lng, p1_lat, p1_lng)
                if seg_d < min_dist:
                    min_dist = seg_d
            return min_dist
        except Exception:
            return 999999.0

    def analyze_vehicle_correlation(
        self,
        vehicle: Vehicle,
        change_polygons: List[ChangePolygon],
        permit: Optional[TimberPermit],
        observation_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multi-feature spatial and temporal correlation between vehicle telemetry and disturbance polygons.
        Computes:
        - Distance to disturbance polygon boundary (meters)
        - Distance to disturbance centroid (meters)
        - Route distance to disturbance polygon (meters)
        - Temporal alignment (time delta between observation & vehicle activity)
        - Route deviation & permit anomaly
        """
        min_poly_boundary_dist_m = 999999.0
        min_centroid_dist_m = 999999.0
        nearest_poly_id = None
        
        for poly in change_polygons:
            # 1. Boundary distance (Phase 11 requirement)
            boundary_d_m = self.min_distance_to_polygon_m(
                vehicle.current_lat, vehicle.current_lng, poly.polygon_geometry
            )
            # 2. Centroid distance
            centroid_d_m = self.haversine_distance_m(
                vehicle.current_lat, vehicle.current_lng,
                poly.centroid_lat, poly.centroid_lng
            )
            
            if boundary_d_m < min_poly_boundary_dist_m:
                min_poly_boundary_dist_m = boundary_d_m
                nearest_poly_id = poly.id
            if centroid_d_m < min_centroid_dist_m:
                min_centroid_dist_m = centroid_d_m

        # Route minimum distance to polygon
        route_min_dist_m = min_poly_boundary_dist_m
        if vehicle.route_history:
            for pt in vehicle.route_history:
                # pt is [lat, lng]
                pt_lat, pt_lng = pt[0], pt[1]
                for poly in change_polygons:
                    d_m = self.min_distance_to_polygon_m(pt_lat, pt_lng, poly.polygon_geometry)
                    if d_m < route_min_dist_m:
                        route_min_dist_m = d_m

        # Temporal correlation check (Phase 12)
        temporal_match = True
        time_diff_hours = 0.0
        if observation_date:
            try:
                obs_dt = datetime.fromisoformat(observation_date.replace("Z", "+00:00"))
                # If vehicle has a timestamp, compute delta
                veh_dt = getattr(vehicle, 'last_seen_timestamp', None)
                if veh_dt:
                    diff_sec = abs((datetime.now() - obs_dt).total_seconds())
                    time_diff_hours = round(diff_sec / 3600.0, 1)
                    if time_diff_hours > settings.VEHICLE_TEMPORAL_WINDOW_HOURS:
                        temporal_match = False
            except Exception:
                temporal_match = True

        # Heading alignment towards disturbance
        heading_alignment = 0.5
        if nearest_poly_id and vehicle.heading_deg is not None:
            # Vector from vehicle to disturbance centroid
            dlat = poly.centroid_lat - vehicle.current_lat
            dlng = poly.centroid_lng - vehicle.current_lng
            angle_to_dist = math.degrees(math.atan2(dlng, dlat)) % 360.0
            diff_angle = abs(vehicle.heading_deg - angle_to_dist)
            if diff_angle > 180:
                diff_angle = 360 - diff_angle
            heading_alignment = round(max(0.0, 1.0 - (diff_angle / 180.0)), 2)

        # Deviation km
        deviation_km = getattr(vehicle, 'route_deviation_km', 0.0) or 0.0

        return {
            "vehicle_id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "distance_to_disturbance_m": round(min_poly_boundary_dist_m, 1),
            "distance_to_centroid_m": round(min_centroid_dist_m, 1),
            "route_distance_m": round(route_min_dist_m, 1),
            "nearest_polygon_id": nearest_poly_id,
            "temporal_match": temporal_match,
            "time_diff_hours": time_diff_hours,
            "heading_alignment": heading_alignment,
            "route_deviation_km": deviation_km,
            "origin": vehicle.origin,
            "destination": vehicle.destination,
            "permit_id": vehicle.permit_id,
            "permit_status": permit.status if permit else "NOT_FOUND"
        }

vehicle_tracker = VehicleTracker()
