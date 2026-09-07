import math
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.database.models import Vehicle

class VehicleSimulator:
    def __init__(self):
        self.vehicles: Dict[str, Vehicle] = {}

    def step_simulation(self) -> List[Vehicle]:
        """
        Updates positions of all simulated vehicles along realistic roads/waypoints.
        """
        updated = []
        for vid, v in self.vehicles.items():
            # Small realistic motion along heading
            speed_deg = (v.speed_kmh / 3600.0) * (1 / 111.0)
            rad = math.radians(v.heading_deg)
            new_lat = v.current_lat + (speed_deg * math.cos(rad)) + random.uniform(-0.0001, 0.0001)
            new_lng = v.current_lng + (speed_deg * math.sin(rad)) + random.uniform(-0.0001, 0.0001)
            
            # Slightly vary heading
            new_heading = (v.heading_deg + random.uniform(-5, 5)) % 360

            v.current_lat = round(new_lat, 6)
            v.current_lng = round(new_lng, 6)
            v.heading_deg = round(new_heading, 1)
            v.route_history.append([v.current_lat, v.current_lng])
            if len(v.route_history) > 50:
                v.route_history.pop(0)

            updated.append(v)
        return updated

vehicle_simulator = VehicleSimulator()
