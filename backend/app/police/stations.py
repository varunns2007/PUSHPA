"""
Police-station registry surrounding each watched forest zone.

NOTE ON DATA: these are DEMO / seeded records with plausible station names
and jurisdictions for the Western Ghats demo region already used elsewhere
in this backend (see app/database/store.py FOREST_ZONES). They are NOT
pulled from a live police-jurisdiction database. Before any real deployment,
replace STATIONS below with your state police department's actual station
directory (most Indian states publish jurisdiction shapefiles / station
lists via their Police GIS cell) or wire in the Google Places API
("police" type search around each forest zone) using
VITE_GOOGLE_MAPS_API_KEY's *server-side* counterpart (a separate,
IP-restricted key — never reuse the browser Maps key server-side).

Everything here is keyed off simple haversine distance, same approach as
app/vehicles/tracker.py, so no extra geospatial dependency is required.
"""
from __future__ import annotations

from typing import Any

from app.vehicles.tracker import haversine_km

# Each station: id, name, jurisdiction/zone it primarily serves, contact
# channel placeholders (wire real numbers/emails before going live), and
# coordinates. Several stations per zone so a real incident nearer one
# corner of a zone routes to the closer station, not just "the zone's
# default station".
STATIONS: list[dict[str, Any]] = [
    # --- Nilgiri Biosphere Reserve — Zone A ---
    {
        "station_id": "PS-A1",
        "name": "Gudalur Forest Range Police Station",
        "zone_id": "ZONE-A",
        "lat": 11.5010,
        "lng": 76.4950,
        "phone": "+91-XXXX-000101",
        "email": "gudalur.ps@demo.tnpolice.gov.in",
    },
    {
        "station_id": "PS-A2",
        "name": "Mudumalai Wildlife & Anti-Poaching Station",
        "zone_id": "ZONE-A",
        "lat": 11.5885,
        "lng": 76.5310,
        "phone": "+91-XXXX-000102",
        "email": "mudumalai.awps@demo.tnpolice.gov.in",
    },
    {
        "station_id": "PS-A3",
        "name": "Coonoor Rural Police Station",
        "zone_id": "ZONE-A",
        "lat": 11.3530,
        "lng": 76.7950,
        "phone": "+91-XXXX-000103",
        "email": "coonoor.rps@demo.tnpolice.gov.in",
    },
    # --- Anamalai Range — Zone B ---
    {
        "station_id": "PS-B1",
        "name": "Pollachi Forest Check-Post Police Station",
        "zone_id": "ZONE-B",
        "lat": 10.6590,
        "lng": 77.0080,
        "phone": "+91-XXXX-000201",
        "email": "pollachi.ps@demo.tnpolice.gov.in",
    },
    {
        "station_id": "PS-B2",
        "name": "Valparai Hill Station Police Outpost",
        "zone_id": "ZONE-B",
        "lat": 10.3270,
        "lng": 76.9550,
        "phone": "+91-XXXX-000202",
        "email": "valparai.outpost@demo.tnpolice.gov.in",
    },
    {
        "station_id": "PS-B3",
        "name": "Udumalaipettai Rural Police Station",
        "zone_id": "ZONE-B",
        "lat": 10.5850,
        "lng": 77.2470,
        "phone": "+91-XXXX-000203",
        "email": "udumalaipettai.rps@demo.tnpolice.gov.in",
    },
    # --- Periyar Buffer Corridor — Zone C ---
    {
        "station_id": "PS-C1",
        "name": "Kumily Forest Border Police Station",
        "zone_id": "ZONE-C",
        "lat": 9.6110,
        "lng": 77.1590,
        "phone": "+91-XXXX-000301",
        "email": "kumily.ps@demo.keralapolice.gov.in",
    },
    {
        "station_id": "PS-C2",
        "name": "Vandiperiyar Police Station",
        "zone_id": "ZONE-C",
        "lat": 9.5460,
        "lng": 77.0800,
        "phone": "+91-XXXX-000302",
        "email": "vandiperiyar.ps@demo.keralapolice.gov.in",
    },
    {
        "station_id": "PS-C3",
        "name": "Cumbum Valley Police Station",
        "zone_id": "ZONE-C",
        "lat": 9.7280,
        "lng": 77.2830,
        "phone": "+91-XXXX-000303",
        "email": "cumbumvalley.ps@demo.tnpolice.gov.in",
    },
]


def nearest_stations(lat: float, lng: float, limit: int = 3, max_km: float | None = None) -> list[dict[str, Any]]:
    """Return the `limit` closest police stations to a point, nearest first.

    Used to answer "which stations surround this exact incident?" rather
    than always notifying a whole zone's stations regardless of which edge
    of the zone the incident is actually on.
    """
    scored = []
    for s in STATIONS:
        d = haversine_km(lat, lng, s["lat"], s["lng"])
        if max_km is not None and d > max_km:
            continue
        scored.append({**s, "distance_km": round(d, 2)})
    scored.sort(key=lambda s: s["distance_km"])
    return scored[:limit]


def stations_for_zone(zone_id: str) -> list[dict[str, Any]]:
    return [s for s in STATIONS if s["zone_id"] == zone_id]
