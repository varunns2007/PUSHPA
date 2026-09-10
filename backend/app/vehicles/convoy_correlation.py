"""
Convoy Correlation Engine — the novel piece of PUSHPA.

Every other layer in this backend scores ONE vehicle at a time (risk
engine) or ONE polygon at a time (change detector). Real timber-smuggling
operations rarely work that way: a felling crew clears a patch, then one
or more trucks make repeated night runs to haul it out over hours or days,
often swapping vehicles/plates to avoid exactly the kind of single-vehicle
pattern-matching most systems look for.

This module correlates across BOTH vehicles and time, against a single
freshly-detected clearing, to surface two patterns a snapshot view can't:

1. REPEAT_VISITOR — the same vehicle has been near the same fresh
   clearing more than once within the lookback window. One pass could be
   a forestry patrol; three passes at night is a haul pattern.

2. CONVOY_SIGNATURE — two or more *different* vehicles were near the same
   fresh clearing within a short time window of each other. This is the
   "swarm" pattern: multiple trucks working one site, hard to justify as
   coincidence, and exactly the kind of thing that should escalate past a
   single vehicle's risk score.

Both patterns are combined into a single explainable `convoy_score`
(0-100) with the contributing evidence attached, so a field officer sees
*why* it fired, not just a number.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from app.vehicles.tracker import haversine_km

PROXIMITY_KM = 3.0
LOOKBACK_HOURS = 72
CONVOY_WINDOW_MINUTES = 180
RECENT_CLEARING_HOURS = 96  # only correlate against polygons detected this recently


def _recent_severe_polygons(change_polygons: list[dict[str, Any]], now: datetime) -> list[dict[str, Any]]:
    out = []
    for poly in change_polygons:
        if poly.get("severity") not in ("SEVERE", "CRITICAL"):
            continue
        detected_at = poly.get("detected_at")
        if not detected_at:
            continue
        try:
            ts = datetime.fromisoformat(detected_at)
        except ValueError:
            continue
        if now - ts <= timedelta(hours=RECENT_CLEARING_HOURS):
            out.append(poly)
    return out


def _sightings_near_polygon(
    position_log: dict[str, list[dict[str, Any]]],
    poly: dict[str, Any],
    now: datetime,
) -> list[dict[str, Any]]:
    """All (vehicle_id, timestamp, distance) sightings within PROXIMITY_KM of
    a polygon's centroid, within LOOKBACK_HOURS — across every tracked
    vehicle, not just one."""
    centroid = poly["centroid"]
    hits: list[dict[str, Any]] = []
    for vehicle_id, log in position_log.items():
        for entry in log:
            try:
                ts = datetime.fromisoformat(entry["timestamp"])
            except (KeyError, ValueError):
                continue
            if now - ts > timedelta(hours=LOOKBACK_HOURS):
                continue
            d = haversine_km(entry["lat"], entry["lng"], centroid["lat"], centroid["lng"])
            if d <= PROXIMITY_KM:
                hits.append({"vehicle_id": vehicle_id, "timestamp": ts, "distance_km": round(d, 2)})
    hits.sort(key=lambda h: h["timestamp"])
    return hits


def analyze_convoy_signatures(
    change_polygons: list[dict[str, Any]],
    position_log: dict[str, list[dict[str, Any]]],
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    """Run the correlation pass across every recent severe clearing.

    Returns one result per polygon that has *any* correlated pattern
    (repeat visitor and/or convoy signature), each with a 0-100
    convoy_score and the evidence list backing it.
    """
    now = now or datetime.utcnow()
    results: list[dict[str, Any]] = []

    for poly in _recent_severe_polygons(change_polygons, now):
        hits = _sightings_near_polygon(position_log, poly, now)
        if not hits:
            continue

        by_vehicle: dict[str, list[dict[str, Any]]] = {}
        for h in hits:
            by_vehicle.setdefault(h["vehicle_id"], []).append(h)

        evidence: list[str] = []
        score = 0

        repeat_visitors = {vid: v for vid, v in by_vehicle.items() if len(v) >= 2}
        for vid, visits in repeat_visitors.items():
            evidence.append(
                f"{vid} sighted within {PROXIMITY_KM} km of this clearing {len(visits)} times "
                f"in the last {LOOKBACK_HOURS}h"
            )
            score += min(30, 12 * len(visits))

        # Convoy signature: distinct vehicles whose sightings fall within
        # CONVOY_WINDOW_MINUTES of each other (sliding window over the
        # sorted hit list).
        convoy_groups: list[list[dict[str, Any]]] = []
        window = timedelta(minutes=CONVOY_WINDOW_MINUTES)
        i = 0
        while i < len(hits):
            group = [hits[i]]
            j = i + 1
            while j < len(hits) and hits[j]["timestamp"] - group[0]["timestamp"] <= window:
                group.append(hits[j])
                j += 1
            distinct_vehicles = {g["vehicle_id"] for g in group}
            if len(distinct_vehicles) >= 2:
                convoy_groups.append(group)
            i = j if j > i + 1 else i + 1

        if convoy_groups:
            best = max(convoy_groups, key=lambda g: len({x["vehicle_id"] for x in g}))
            distinct = sorted({x["vehicle_id"] for x in best})
            evidence.append(
                f"{len(distinct)} different vehicles ({', '.join(distinct)}) near this clearing "
                f"within a {CONVOY_WINDOW_MINUTES}-minute window"
            )
            score += min(50, 20 * len(distinct))

        # Night-time bonus — smuggling runs cluster overnight far more than
        # legitimate forestry/patrol traffic.
        night_hits = [h for h in hits if h["timestamp"].hour < 5 or h["timestamp"].hour >= 22]
        if night_hits:
            evidence.append(f"{len(night_hits)} of the sightings occurred overnight (22:00–05:00)")
            score += 15

        if not evidence:
            continue

        score = min(100, score)
        results.append(
            {
                "polygon_id": poly["polygon_id"],
                "zone_id": poly["zone_id"],
                "centroid": poly["centroid"],
                "convoy_score": score,
                "rating": (
                    "CRITICAL" if score >= 75 else "HIGH" if score >= 50 else "MODERATE" if score >= 25 else "LOW"
                ),
                "vehicles_involved": sorted(by_vehicle.keys()),
                "is_convoy_signature": bool(convoy_groups),
                "is_repeat_visitor": bool(repeat_visitors),
                "evidence": evidence,
                "generated_at": now.isoformat(),
            }
        )

    results.sort(key=lambda r: r["convoy_score"], reverse=True)
    return results
