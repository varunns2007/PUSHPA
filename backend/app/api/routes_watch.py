from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import store
from app.database.store import FOREST_ZONES, WATCH_HISTORY
from app.scheduler.watch import (
    ALERT_DROP_THRESHOLD_PCT,
    WATCH_INTERVAL_HOURS,
    run_watch_cycle,
)

router = APIRouter(prefix="/api/watch", tags=["watch"])


@router.get("/status")
def status():
    """Is the automatic daily/periodic satellite check running, and when
    did it last look? Shown in Settings so a non-technical user can
    confirm the system is actually watching, not just sitting idle."""
    return {
        "interval_hours": WATCH_INTERVAL_HOURS,
        "alert_threshold_pct": ALERT_DROP_THRESHOLD_PCT,
        "last_run_at": store.WATCH_LAST_RUN_AT,
        "zones_watched": [z["id"] for z in FOREST_ZONES],
    }


@router.get("/history")
def history(zone_id: str | None = None):
    """Every automated comparison the scheduler has run, most recent
    first — the audit trail behind each daily/periodic check."""
    if zone_id:
        return {"history": WATCH_HISTORY.get(zone_id, [])}
    merged = [entry for zone_history in WATCH_HISTORY.values() for entry in zone_history]
    merged.sort(key=lambda r: r["checked_at"], reverse=True)
    return {"history": merged[:100]}


@router.post("/run-now")
def run_now():
    """Trigger an out-of-schedule check immediately, instead of waiting
    for the next timer tick — useful for demos and for "did anything
    change since this morning?" checks."""
    results = run_watch_cycle()
    if not results:
        raise HTTPException(500, "Watch cycle produced no results — check backend logs.")
    return {"ran_at": store.WATCH_LAST_RUN_AT, "results": results}
