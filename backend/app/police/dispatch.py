"""
Turns "an alert was raised" into "the surrounding police stations were
notified" — the step most anti-smuggling demos skip. Every alert (vehicle
risk-based or satellite-watch/zone-based) gets routed here.

DEMO MODE (default): dispatch is SIMULATED. Nothing is actually texted or
emailed to anyone — it's logged and returned in the alert payload as a
`notified_stations` list so the frontend can show "Notified: <station>,
<station>" the instant the alert appears, which is the whole point for a
hackathon judge to see: detection -> nearest jurisdiction -> notification,
all in one push, with no manual step in between.

GOING LIVE: set POLICE_DISPATCH_LIVE=1 and fill in a real transport (SMTP
for email, Twilio/MSG91/etc. for SMS) in `_send_live()`. Nothing else in
this file needs to change — callers (alerts/stream.py) already call
`dispatch_to_stations()` regardless of mode.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

from app.police.stations import nearest_stations

logger = logging.getLogger("pushpa.police_dispatch")

DISPATCH_RADIUS_KM = float(os.getenv("POLICE_DISPATCH_RADIUS_KM", "25"))
DISPATCH_LIMIT = int(os.getenv("POLICE_DISPATCH_LIMIT", "3"))
_LIVE = os.getenv("POLICE_DISPATCH_LIVE", "0") == "1"


def dispatch_to_stations(
    lat: float,
    lng: float,
    alert_id: str,
    headline: str,
    severity: str,
) -> list[dict[str, Any]]:
    """Find the nearest police stations to an incident and notify them.

    Returns the list of stations notified (each with distance_km and a
    dispatch record) so callers can attach it directly to the alert
    they're already building.
    """
    stations = nearest_stations(lat, lng, limit=DISPATCH_LIMIT, max_km=DISPATCH_RADIUS_KM)
    if not stations:
        logger.warning("No police station within %s km of (%s, %s) for %s", DISPATCH_RADIUS_KM, lat, lng, alert_id)
        return []

    notified = []
    for s in stations:
        record = _send(s, alert_id, headline, severity)
        notified.append({**s, "dispatch": record})
    return notified


def _send(station: dict[str, Any], alert_id: str, headline: str, severity: str) -> dict[str, Any]:
    message = (
        f"[PUSHPA ALERT {alert_id}] {severity.upper()} — {headline}. "
        f"Nearest jurisdiction: {station['name']} ({station['distance_km']} km from incident)."
    )
    if _LIVE:
        return _send_live(station, message)

    # Simulated dispatch — this is the default and the only mode required
    # for the hackathon demo.
    logger.info("SIMULATED DISPATCH -> %s: %s", station["name"], message)
    return {
        "mode": "SIMULATED",
        "channel": "log",
        "message": message,
        "sent_at": datetime.utcnow().isoformat(),
        "status": "SIMULATED_SENT",
    }


def _send_live(station: dict[str, Any], message: str) -> dict[str, Any]:  # pragma: no cover
    """Real dispatch hook. Left unimplemented on purpose — plug in your
    SMS/email provider here. Example shape for an SMTP + Twilio setup:

        import smtplib
        from email.mime.text import MIMEText
        # ... build and send MIMEText to station["email"] ...

        from twilio.rest import Client
        client = Client(os.environ["TWILIO_SID"], os.environ["TWILIO_TOKEN"])
        client.messages.create(to=station["phone"], from_=os.environ["TWILIO_FROM"], body=message)

    Raising here on purpose so nobody accidentally ships POLICE_DISPATCH_LIVE=1
    without wiring a real transport first.
    """
    raise NotImplementedError(
        "POLICE_DISPATCH_LIVE=1 but _send_live() has no transport configured. "
        "Wire in SMTP/Twilio/etc. before enabling live dispatch."
    )
