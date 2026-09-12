from __future__ import annotations

import heapq
import math
from typing import Any, Optional
import requests

from app.vehicles.tracker import haversine_km

# ---------------------------------------------------------------------------
# Strategic Police Stations & Outposts
# ---------------------------------------------------------------------------
POLICE_STATIONS: list[dict[str, Any]] = [
    {
        "station_name": "Gudalur Police Station",
        "phone": "+91-423-261234",
        "jurisdiction_code": "TN-NIL-GUD-01",
        "lat": 11.5074,
        "lng": 76.4925,
        "avg_response_speed_kmh": 65.0,
    },
    {
        "station_name": "Ooty Central Police Station",
        "phone": "+91-423-244222",
        "jurisdiction_code": "TN-NIL-OOT-02",
        "lat": 11.4102,
        "lng": 76.7031,
        "avg_response_speed_kmh": 60.0,
    },
    {
        "station_name": "Naduvattam Police Outpost",
        "phone": "+91-423-274100",
        "jurisdiction_code": "TN-NIL-NDV-05",
        "lat": 11.4789,
        "lng": 76.5478,
        "avg_response_speed_kmh": 60.0,
    },
    {
        "station_name": "Mudumalai Forest Checkpost Station",
        "phone": "+91-423-252623",
        "jurisdiction_code": "TN-FOR-MDM-04",
        "lat": 11.5833,
        "lng": 76.5333,
        "avg_response_speed_kmh": 65.0,
    },
    {
        "station_name": "Coonoor Police Station",
        "phone": "+91-423-223030",
        "jurisdiction_code": "TN-NIL-CNR-03",
        "lat": 11.3530,
        "lng": 76.7959,
        "avg_response_speed_kmh": 60.0,
    },
]

# ---------------------------------------------------------------------------
# Key Highway Bottlenecks & Strategic Chokepoints
# ---------------------------------------------------------------------------
CHOKEPOINTS: list[dict[str, Any]] = [
    {
        "name": "Naduvattam Toll-Barrier Bottleneck",
        "road_name": "NH-67 Ooty-Gudalur Highway",
        "lat": 11.4789,
        "lng": 76.5478,
        "type": "PRIMARY_CORRIDOR_BOTTLENECK",
    },
    {
        "name": "Kakkatty-Mudumalai Chokepoint",
        "road_name": "Kalhatty Ghat Route",
        "lat": 11.5320,
        "lng": 76.6020,
        "type": "GHAT_PASS_BOTTLENECK",
    },
    {
        "name": "Gudalur-Kerala Border Checkpost",
        "road_name": "SH-28 Interstate Gateway",
        "lat": 11.5120,
        "lng": 76.4850,
        "type": "INTERSTATE_BORDER_BARRIER",
    },
    {
        "name": "Bandipur Border Arch Checkpoint",
        "road_name": "NH-181 Karnataka Boundary Gate",
        "lat": 11.6650,
        "lng": 76.6280,
        "type": "DOWNSTREAM_INTERSTATE_CHECKPOINT",
    },
    {
        "name": "Ketti Valley Highway Intercept",
        "road_name": "NH-181 Southbound Corridor",
        "lat": 11.3720,
        "lng": 76.7320,
        "type": "SOUTHERN_VALLEY_CHOKEPOINT",
    },
]

# ---------------------------------------------------------------------------
# Regional Topological Road Graph Network
# ---------------------------------------------------------------------------
# Graph representation of major junctions and segments in the Nilgiris
ROAD_GRAPH_NODES: dict[str, tuple[float, float]] = {
    "NILGIRI_INTERIOR": (11.4085, 76.6965),
    "PYKARA_JUNCTION": (11.4510, 76.6010),
    "NADUVATTAM_JUNCTION": (11.4789, 76.5478),
    "GUDALUR_JUNCTION": (11.5074, 76.4925),
    "KERALA_BORDER": (11.5120, 76.4850),
    "OOTY_CENTRAL": (11.4102, 76.7031),
    "KALHATTY_GHAT": (11.4650, 76.6750),
    "KAKKATTY_CHOKEPOINT": (11.5320, 76.6020),
    "THEPPARKADU": (11.5833, 76.5333),
    "BANDIPUR_BORDER": (11.6650, 76.6280),
    "KETTI_VALLEY": (11.3720, 76.7320),
    "COONOOR_TOWN": (11.3530, 76.7959),
}

# Road segments: (from, to, length_km, road_type, speed_limit_kmh)
ROAD_GRAPH_EDGES: list[tuple[str, str, float, str, float]] = [
    ("NILGIRI_INTERIOR", "OOTY_CENTRAL", 2.5, "unpaved_track", 25.0),
    ("NILGIRI_INTERIOR", "PYKARA_JUNCTION", 11.2, "interior_track", 35.0),
    ("OOTY_CENTRAL", "PYKARA_JUNCTION", 18.0, "highway_nh67", 50.0),
    ("PYKARA_JUNCTION", "NADUVATTAM_JUNCTION", 8.4, "highway_nh67", 50.0),
    ("NADUVATTAM_JUNCTION", "GUDALUR_JUNCTION", 14.5, "highway_nh67", 55.0),
    ("GUDALUR_JUNCTION", "KERALA_BORDER", 3.2, "state_highway_28", 60.0),
    ("OOTY_CENTRAL", "KALHATTY_GHAT", 8.5, "ghat_road", 30.0),
    ("KALHATTY_GHAT", "KAKKATTY_CHOKEPOINT", 9.2, "ghat_road", 30.0),
    ("KAKKATTY_CHOKEPOINT", "THEPPARKADU", 12.0, "ghat_road", 40.0),
    ("THEPPARKADU", "BANDIPUR_BORDER", 14.0, "highway_nh181", 60.0),
    ("OOTY_CENTRAL", "KETTI_VALLEY", 6.8, "highway_nh181", 55.0),
    ("KETTI_VALLEY", "COONOOR_TOWN", 9.5, "highway_nh181", 55.0),
]


def _build_adjacency_list() -> dict[str, list[tuple[str, float, float]]]:
    adj: dict[str, list[tuple[str, float, float]]] = {node: [] for node in ROAD_GRAPH_NODES}
    for u, v, dist_km, rtype, speed_kmh in ROAD_GRAPH_EDGES:
        travel_time_mins = (dist_km / max(speed_kmh, 10.0)) * 60.0
        adj[u].append((v, dist_km, travel_time_mins))
        adj[v].append((u, dist_km, travel_time_mins))
    return adj


ROAD_ADJACENCY = _build_adjacency_list()


def find_nearest_node(lat: float, lng: float) -> str:
    best_node = "NILGIRI_INTERIOR"
    best_dist = float("inf")
    for node, coords in ROAD_GRAPH_NODES.items():
        d = haversine_km(lat, lng, coords[0], coords[1])
        if d < best_dist:
            best_dist = d
            best_node = node
    return best_node


def calculate_topological_distance_and_time(
    start_lat: float, start_lng: float, target_lat: float, target_lng: float, speed_kmh: float = 40.0
) -> tuple[float, float]:
    """
    Computes road network distance (km) and travel time (minutes) using Dijkstra's shortest path
    across the topological road network. Falls back smoothly if offline.
    """
    start_node = find_nearest_node(start_lat, start_lng)
    target_node = find_nearest_node(target_lat, target_lng)

    start_lead_in_km = haversine_km(start_lat, start_lng, ROAD_GRAPH_NODES[start_node][0], ROAD_GRAPH_NODES[start_node][1])
    target_lead_out_km = haversine_km(target_lat, target_lng, ROAD_GRAPH_NODES[target_node][0], ROAD_GRAPH_NODES[target_node][1])

    if start_node == target_node:
        direct_dist = haversine_km(start_lat, start_lng, target_lat, target_lng)
        road_dist = max(direct_dist * 1.25, 0.5)
        time_mins = (road_dist / max(speed_kmh, 15.0)) * 60.0
        return round(road_dist, 2), round(time_mins, 1)

    # Dijkstra
    dist_map: dict[str, float] = {node: float("inf") for node in ROAD_GRAPH_NODES}
    time_map: dict[str, float] = {node: float("inf") for node in ROAD_GRAPH_NODES}
    dist_map[start_node] = 0.0
    time_map[start_node] = 0.0

    pq = [(0.0, 0.0, start_node)]
    while pq:
        cur_time, cur_dist, u = heapq.heappop(pq)
        if cur_time > time_map[u]:
            continue
        if u == target_node:
            break
        for v, edge_dist, edge_time in ROAD_ADJACENCY[u]:
            # Scale edge_time by the vehicle's speed if specified
            scaled_time = (edge_dist / max(speed_kmh, 15.0)) * 60.0
            if cur_time + scaled_time < time_map[v]:
                time_map[v] = cur_time + scaled_time
                dist_map[v] = cur_dist + edge_dist
                heapq.heappush(pq, (time_map[v], dist_map[v], v))

    total_dist = dist_map[target_node] + start_lead_in_km + target_lead_out_km
    total_time = time_map[target_node] + ((start_lead_in_km + target_lead_out_km) / max(speed_kmh, 20.0)) * 60.0

    return round(total_dist, 2), round(total_time, 1)


def compute_interception_plan(
    smuggler_lat: float,
    smuggler_lng: float,
    smuggler_speed_kmh: float,
    smuggler_heading: float,
) -> dict[str, Any]:
    """
    Evaluates candidate chokepoints and available police stations.
    Finds the optimal bottleneck where T_police < T_smuggler with >= 3 min safety margin.
    """
    effective_speed = max(smuggler_speed_kmh, 30.0)
    candidates = []

    for cp in CHOKEPOINTS:
        dist_km, smuggler_eta_mins = calculate_topological_distance_and_time(
            smuggler_lat, smuggler_lng, cp["lat"], cp["lng"], speed_kmh=effective_speed
        )

        # Evaluate all police stations for this chokepoint
        best_station = None
        best_police_eta = float("inf")

        for station in POLICE_STATIONS:
            p_dist, p_eta = calculate_topological_distance_and_time(
                station["lat"],
                station["lng"],
                cp["lat"],
                cp["lng"],
                speed_kmh=station.get("avg_response_speed_kmh", 60.0),
            )
            # Add 1.5 min dispatch reaction overhead
            p_total_eta = p_eta + 1.5
            if p_total_eta < best_police_eta:
                best_police_eta = p_total_eta
                best_station = {
                    "station_name": station["station_name"],
                    "phone": station["phone"],
                    "jurisdiction_code": station["jurisdiction_code"],
                    "lat": station["lat"],
                    "lng": station["lng"],
                    "distance_to_chokepoint_km": p_dist,
                }

        margin = smuggler_eta_mins - best_police_eta

        feasibility = (
            "OPTIMAL_INTERCEPT"
            if margin >= 3.0
            else "SECONDARY_BACKUP"
            if margin >= 0.5
            else "INFEASIBLE_TACTICAL_LAG"
        )

        candidates.append({
            "name": cp["name"],
            "road_name": cp["road_name"],
            "lat": cp["lat"],
            "lng": cp["lng"],
            "smuggler_eta_mins": round(smuggler_eta_mins, 1),
            "smuggler_dist_km": dist_km,
            "police_eta_mins": round(best_police_eta, 1),
            "safety_margin_mins": round(margin, 1),
            "feasibility": feasibility,
            "assigned_station": best_station,
        })

    # Sort candidates by feasibility and strategic intercept optimality
    # Preference: OPTIMAL_INTERCEPT with adequate margin and lowest smuggler_eta_mins
    optimal_list = [c for c in candidates if c["feasibility"] == "OPTIMAL_INTERCEPT"]
    secondary_list = [c for c in candidates if c["feasibility"] == "SECONDARY_BACKUP"]

    if optimal_list:
        # Choose the earliest feasible bottleneck so interception happens before they reach outer borders
        chosen = min(optimal_list, key=lambda c: c["smuggler_eta_mins"])
    elif secondary_list:
        chosen = max(secondary_list, key=lambda c: c["safety_margin_mins"])
    else:
        # Fallback to the downstream interstate checkpoint with max distance
        chosen = max(candidates, key=lambda c: c["smuggler_dist_km"])

    return {
        "target_chokepoint": {
            "name": chosen["name"],
            "road_name": chosen["road_name"],
            "lat": chosen["lat"],
            "lng": chosen["lng"],
            "smuggler_eta_mins": chosen["smuggler_eta_mins"],
            "police_eta_mins": chosen["police_eta_mins"],
            "safety_margin_mins": chosen["safety_margin_mins"],
            "feasibility": chosen["feasibility"],
        },
        "assigned_police_station": chosen["assigned_station"],
        "all_candidate_chokepoints": candidates,
    }
