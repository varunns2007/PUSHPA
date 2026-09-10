"""
The "check the forest every day automatically" job.

Without this, someone has to remember to open the app and manually pick
two dates to compare. That doesn't scale to dozens of forest zones and
doesn't catch anything that happens between visits.

`run_watch_cycle()` is what actually does the work: for every watched
zone, it fetches today's satellite view, compares it against the last
time we looked, and — if the drop in tree cover crosses a threshold —
raises an alert automatically, with a plain-language reason attached.

`start_scheduler()` wraps that in APScheduler so it runs on a timer
(daily by default, configurable) for the whole life of the backend
process. This is deliberately a simple in-process scheduler, not a
distributed job queue — appropriate for a single backend instance
watching a handful of zones; swap for Celery/cron + a real database if
this needs to scale past that.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

from app.alerts.stream import raise_convoy_alert, raise_forest_alert
from app.database import store
from app.database.store import CHANGE_POLYGONS, FOREST_ZONES, VEHICLE_POSITION_LOG, WATCH_HISTORY, record_watch_result
from app.explain.plain_language import explain_change
from app.geospatial.change_detector import compute_delta, severe_loss_mask
from app.geospatial.density_analyzer import analyze_density
from app.geospatial.polygon_extractor import extract_polygons
from app.satellite.ndvi import compute_ndvi
from app.satellite.sentinel_client import fetch_bands_for_zone
from app.vehicles.convoy_correlation import analyze_convoy_signatures

logger = logging.getLogger("pushpa.watch")

WATCH_INTERVAL_HOURS = float(os.getenv("WATCH_INTERVAL_HOURS", "24"))
# Comma-separated zone IDs to watch, e.g. "ZONE-A,ZONE-B". Empty = all zones.
_configured_zones = os.getenv("WATCH_ZONE_IDS", "").strip()
WATCH_ZONE_IDS = [z.strip() for z in _configured_zones.split(",") if z.strip()] or None
ALERT_DROP_THRESHOLD_PCT = float(os.getenv("WATCH_ALERT_THRESHOLD_PCT", "15"))
LOOKBACK_DAYS = int(os.getenv("WATCH_LOOKBACK_DAYS", "10"))

_scheduler = None  # module-level singleton so start/stop are idempotent


def _zones_to_watch() -> list[dict]:
    if WATCH_ZONE_IDS is None:
        return FOREST_ZONES
    return [z for z in FOREST_ZONES if z["id"] in WATCH_ZONE_IDS]


def run_watch_cycle() -> list[dict]:
    """Run one comparison pass over every watched zone. Called on the
    scheduler's timer, and also exposed via POST /api/watch/run-now for
    an on-demand check without waiting for the clock."""
    today = datetime.utcnow().date()
    results = []

    for zone in _zones_to_watch():
        zone_id = zone["id"]
        history = WATCH_HISTORY.get(zone_id, [])
        # Compare against the last time we actually looked, if we have a
        # prior run; otherwise fall back to a fixed lookback window so the
        # very first run still has something to compare against.
        before_date = history[0]["after_date"] if history else str(today - timedelta(days=LOOKBACK_DAYS))
        after_date = str(today)

        try:
            before_bands, before_meta = fetch_bands_for_zone(zone, before_date)
            after_bands, after_meta = fetch_bands_for_zone(zone, after_date)
        except Exception as exc:  # never let one zone's failure kill the cycle
            logger.warning("Watch cycle failed for %s: %s", zone_id, exc)
            continue

        ndvi_before = compute_ndvi(before_bands["B04"], before_bands["B08"])
        ndvi_after = compute_ndvi(after_bands["B04"], after_bands["B08"])
        before_analysis = analyze_density(ndvi_before)
        after_analysis = analyze_density(ndvi_after)

        mask = severe_loss_mask(compute_delta(ndvi_before, ndvi_after))
        polygons = extract_polygons(mask, ndvi_before, ndvi_after, zone["center"], zone_id)
        area_lost_ha = round(sum(p["area_ha"] for p in polygons), 2)
        drop_pct = round(max(0.0, before_analysis["canopy_density_pct"] - after_analysis["canopy_density_pct"]), 1)

        plain = explain_change(
            zone_name=zone["name"],
            before_date=before_meta["observation_date_actual"],
            after_date=after_meta["observation_date_actual"],
            density_before_pct=before_analysis["canopy_density_pct"],
            density_after_pct=after_analysis["canopy_density_pct"],
            area_lost_ha=area_lost_ha,
            data_source=after_meta["source"],
        )

        result = {
            "zone_id": zone_id,
            "zone_name": zone["name"],
            "before_date": before_meta["observation_date_actual"],
            "after_date": after_meta["observation_date_actual"],
            "checked_at": datetime.utcnow().isoformat(),
            "canopy_density_before_pct": before_analysis["canopy_density_pct"],
            "canopy_density_after_pct": after_analysis["canopy_density_pct"],
            "drop_pct": drop_pct,
            "area_lost_ha": area_lost_ha,
            "polygons_found": len(polygons),
            "source": after_meta["source"],
            "plain_language": plain,
            "alerted": False,
        }

        if drop_pct >= ALERT_DROP_THRESHOLD_PCT:
            top_polygon = polygons[0] if polygons else None
            raise_forest_alert(
                zone_id,
                zone["name"],
                plain["severity_word"],
                plain["headline"],
                top_polygon["polygon_id"] if top_polygon else None,
                centroid=top_polygon["centroid"] if top_polygon else zone["center"],
            )
            result["alerted"] = True

        record_watch_result(zone_id, result)
        results.append(result)

    store.WATCH_LAST_RUN_AT = datetime.utcnow().isoformat()

    # Convoy Correlation pass — runs after every watch cycle so a fresh
    # clearing is immediately checked against vehicle position history for
    # multi-vehicle / repeat-visitor patterns, not just single-vehicle risk.
    for signature in analyze_convoy_signatures(list(CHANGE_POLYGONS.values()), VEHICLE_POSITION_LOG):
        if signature["rating"] in ("HIGH", "CRITICAL"):
            raise_convoy_alert(signature)

    return results


def start_scheduler():
    """Start the background timer. Safe to call multiple times (no-op if
    already running). Call from FastAPI's startup event."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    from apscheduler.schedulers.background import BackgroundScheduler

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        run_watch_cycle,
        "interval",
        hours=WATCH_INTERVAL_HOURS,
        id="pushpa_satellite_watch",
        next_run_time=datetime.utcnow(),  # also run once immediately on boot
    )
    _scheduler.start()
    logger.info("PUSHPA satellite watch scheduler started (every %sh)", WATCH_INTERVAL_HOURS)
    return _scheduler


def stop_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
