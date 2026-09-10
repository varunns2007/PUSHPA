"""
Plain-language explanation layer.

Every other module in this backend speaks in NDVI values, reflectance
bands, and pixel counts — correct, but meaningless to a forest guard,
a district officer, or a journalist who just wants to know "did we lose
forest here, and how bad is it?"

This module is the translator. It takes the same numbers the API already
computes and turns them into:
  1. one plain sentence ("headline")
  2. a severity word a human would actually say out loud
  3. a real-world comparison (football fields, not hectares)
  4. a short "what am I looking at" caption for the satellite image itself
  5. an honest caveat about what satellites can and can't prove

Nothing here changes the underlying science — it only re-narrates numbers
that ndvi.py / change_detector.py / density_analyzer.py already produced.
"""
from __future__ import annotations

from typing import Any

# A FIFA-standard football pitch is ~0.714 ha. Used because it's a unit
# most people can picture, unlike "2.73 hectares".
FOOTBALL_FIELD_HA = 0.714


_SEVERITY_TIERS = [
    (3, "No real change", "Nothing to act on — this is normal week-to-week variation."),
    (10, "Slight thinning", "Worth a note, not an alarm. Keep watching this spot."),
    (25, "Noticeable clearing", "Send a field team to check — this pattern usually means people, not weather."),
    (50, "Significant deforestation", "This is a strong signal of illegal felling. Verify on the ground and flag it."),
    (float("inf"), "Severe clearing", "A large chunk of forest disappeared here. This needs an urgent site visit."),
]
# Hectares-lost thresholds matched to the same words. A zone-wide average
# can look fine while one concentrated patch inside it is badly hit — this
# keeps the headline honest about a real localized clearing even when the
# whole-zone average drop % looks small.
_AREA_TIERS_HA = [
    (2, 0), (8, 1), (20, 2), (50, 3), (float("inf"), 4),
]


def _tier_index(drop_pct: float) -> int:
    for i, (ceiling, _, _) in enumerate(_SEVERITY_TIERS):
        if drop_pct < ceiling:
            return i
    return len(_SEVERITY_TIERS) - 1


def _area_tier_index(area_lost_ha: float) -> int:
    for ceiling, idx in _AREA_TIERS_HA:
        if area_lost_ha < ceiling:
            return idx
    return len(_SEVERITY_TIERS) - 1


def _severity(drop_pct: float, area_lost_ha: float = 0.0) -> tuple[str, str]:
    """Return (severity_word, plain_action). Takes the worse of two views:
    the zone-wide average density drop, and the actual hectares a localized
    clearing pass found — so a small average change doesn't hide a real,
    concentrated clearing inside it."""
    idx = max(_tier_index(drop_pct), _area_tier_index(area_lost_ha))
    _, word, action = _SEVERITY_TIERS[idx]
    return word, action


def _area_comparison(area_lost_ha: float) -> str:
    if area_lost_ha <= 0:
        return "no measurable area"
    fields = area_lost_ha / FOOTBALL_FIELD_HA
    if fields < 1:
        return f"about {round(fields * 100)}% of a football field"
    if fields < 1000:
        return f"about {fields:.1f} football fields" if fields < 10 else f"about {round(fields)} football fields"
    return f"about {fields / 1000:.1f} thousand football fields"


def _color_caption(canopy_density_pct: float) -> str:
    """What a non-expert should understand when they look at the false-colour
    NDVI image: green = healthy trees, yellow/brown = thinning or bare soil."""
    if canopy_density_pct >= 80:
        return "Deep green in this image means thick, healthy tree cover — the forest here is doing well."
    if canopy_density_pct >= 60:
        return "Mostly green with a few lighter patches — good tree cover, nothing concerning yet."
    if canopy_density_pct >= 40:
        return "A mix of green and yellow-brown — the canopy is thinning out in parts of this area."
    if canopy_density_pct >= 20:
        return "Mostly yellow-brown with little green — vegetation here is sparse or damaged."
    return "Mostly brown/bare — this patch reads as cleared or bare ground, not forest."


def explain_snapshot(
    zone_name: str,
    observation_date: str,
    canopy_density_pct: float,
    data_source: str = "synthetic",
) -> dict[str, Any]:
    """Plain-language caption for a single-date NDVI snapshot (no comparison)."""
    return {
        "headline": f"On {observation_date}, {zone_name} showed about {canopy_density_pct:.0f}% healthy tree cover.",
        "what_the_colors_mean": _color_caption(canopy_density_pct),
        "data_source_note": _source_note(data_source),
    }


def explain_change(
    zone_name: str,
    before_date: str,
    after_date: str,
    density_before_pct: float,
    density_after_pct: float,
    area_lost_ha: float,
    valuable_species_lost: str | None = None,
    data_source: str = "synthetic",
    cloud_cover_note: str | None = None,
) -> dict[str, Any]:
    """Plain-language explanation for a before/after comparison — this is
    what should be shown front-and-centre next to any Satellite Compare
    or daily-watch result."""
    drop_pct = max(0.0, density_before_pct - density_after_pct)
    severity_word, action = _severity(drop_pct, area_lost_ha)
    grew = density_after_pct > density_before_pct + 1

    if grew:
        headline = (
            f"Good news: {zone_name} actually looks greener on {after_date} than it did on "
            f"{before_date} — tree cover rose from about {density_before_pct:.0f}% to "
            f"{density_after_pct:.0f}%. This usually just means the season changed (post-monsoon "
            f"regrowth), not new planting."
        )
        severity_word, action = "Improved / regrew", "No action needed — likely seasonal regrowth."
    else:
        headline = (
            f"{zone_name} lost tree cover between {before_date} and {after_date}: canopy density "
            f"dropped from about {density_before_pct:.0f}% to {density_after_pct:.0f}%, which works "
            f"out to roughly {_area_comparison(area_lost_ha)} of forest ({area_lost_ha:.2f} hectares) "
            f"gone in that window."
        )

    species_line = None
    if valuable_species_lost:
        species_line = (
            f"Some of the missing canopy overlaps a spot previously logged for {valuable_species_lost} — "
            f"that raises the chance this is commercial timber theft rather than natural dieback."
        )

    return {
        "headline": headline,
        "severity_word": severity_word,
        "recommended_action": action,
        "area_lost_ha": round(area_lost_ha, 2),
        "area_lost_plain": _area_comparison(area_lost_ha),
        "what_the_colors_mean": _color_caption(density_after_pct),
        "species_note": species_line,
        "confidence_caveat": (
            "This comes from satellite images, not a person on the ground. Clouds, shadows, and "
            "even a dry season can look like tree loss. Treat this as a lead to check, not final proof."
            + (f" Note: {cloud_cover_note}" if cloud_cover_note else "")
        ),
        "data_source_note": _source_note(data_source),
    }


def _source_note(data_source: str) -> str:
    if data_source == "live":
        return "Based on a real Sentinel-2 satellite pass over this area."
    if data_source == "live_fallback":
        return (
            "No cloud-free real satellite pass was available for the exact dates requested, so the "
            "nearest usable pass was used instead — see 'observation_date_actual'."
        )
    return "DEMO MODE: this is simulated data for demonstration, not a real satellite image."
