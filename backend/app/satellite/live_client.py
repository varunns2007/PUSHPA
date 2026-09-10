"""
Real satellite client — Sentinel-2 imagery via Microsoft Planetary Computer.

This replaces the synthetic data in `sentinel_client.py` with an actual
live feed:

  - Sentinel-2 is a real European Space Agency (ESA/Copernicus) satellite
    pair that photographs every point on Earth roughly every 5 days.
  - Microsoft's Planetary Computer (https://planetarycomputer.microsoft.com)
    hosts a free, public, continuously-updated mirror of the entire
    Sentinel-2 archive as a searchable STAC catalogue. No credit card, no
    paid key, and no quota needed for the volumes this project needs —
    an optional free subscription key only raises the rate limit.

How it works, in order:
  1. `search_scene()` asks the catalogue: "for this small area on Earth,
     what satellite passes do you have near this date, with acceptable
     cloud cover?" It gets back a list of real scenes, each with an ID,
     a capture date, and a cloud-cover percentage.
  2. We pick the least-cloudy scene closest to the requested date.
  3. `fetch_bands_live()` opens that scene's Red (B04) and Near-Infrared
     (B08) bands — the same two bands `ndvi.py` already expects — reads
     just the small window covering our forest zone, and downsamples it
     to the same GRID_SIZE the rest of the pipeline uses. Everything
     downstream (NDVI, change detection, polygon extraction) is
     unmodified: it can't tell the difference between this and the
     synthetic generator.
  4. `preview_url()` builds a link to an actual true-colour PNG rendering
     of that same scene, so a human can open the real photograph, not
     just the numbers.

If no cloud-free scene exists near the requested date (common in the
monsoon), this raises `LiveFetchUnavailable` and the caller
(`sentinel_client.fetch_bands_for_zone`) falls back to the synthetic
generator so the app never breaks — it just tells the user it fell back.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np

STAC_API_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
COLLECTION = "sentinel-2-l2a"
MAX_CLOUD_COVER = 40  # percent; scenes cloudier than this are skipped
SEARCH_WINDOW_DAYS = 20  # look this many days either side of the target date
TILE_SPAN_M = 2000.0  # match TILE_SPAN_M in geospatial/polygon_extractor.py


class LiveFetchUnavailable(Exception):
    """Raised when no usable real satellite scene could be found or read."""


@dataclass
class SceneMatch:
    item_id: str
    collection: str
    observed_date: str
    cloud_cover: float
    href_b04: str
    href_b08: str
    preview_href: str


def _bbox_around(lat: float, lng: float, span_m: float) -> tuple[float, float, float, float]:
    """Small (min_lng, min_lat, max_lng, max_lat) box centred on a point."""
    half_km = (span_m / 2) / 1000
    dlat = half_km / 111.32
    dlng = half_km / (111.32 * max(0.1, math.cos(math.radians(lat))))
    return (lng - dlng, lat - dlat, lng + dlng, lat + dlat)


def search_scene(lat: float, lng: float, target_date: str) -> SceneMatch:
    """Query the Planetary Computer STAC catalogue for the best real
    Sentinel-2 scene covering (lat, lng) near target_date."""
    try:
        import planetary_computer
        import pystac_client
    except ImportError as exc:  # pragma: no cover
        raise LiveFetchUnavailable(
            "pystac-client / planetary-computer not installed — run "
            "`pip install pystac-client planetary-computer` (see requirements.txt)"
        ) from exc

    bbox = _bbox_around(lat, lng, TILE_SPAN_M)
    center = datetime.fromisoformat(target_date)
    date_from = (center - timedelta(days=SEARCH_WINDOW_DAYS)).strftime("%Y-%m-%d")
    date_to = (center + timedelta(days=SEARCH_WINDOW_DAYS)).strftime("%Y-%m-%d")

    catalog = pystac_client.Client.open(STAC_API_URL, modifier=planetary_computer.sign_inplace)
    search = catalog.search(
        collections=[COLLECTION],
        bbox=bbox,
        datetime=f"{date_from}/{date_to}",
        query={"eo:cloud_cover": {"lt": MAX_CLOUD_COVER}},
    )
    items = list(search.items())
    if not items:
        raise LiveFetchUnavailable(
            f"No Sentinel-2 pass with <{MAX_CLOUD_COVER}% cloud cover found within "
            f"{SEARCH_WINDOW_DAYS} days of {target_date} for this location."
        )

    def _distance_days(item) -> float:
        item_date = datetime.fromisoformat(str(item.datetime.date()))
        return abs((item_date - center).days)

    # Prefer the clearest scene closest to the requested date: sort by a
    # blend of cloud cover and date distance so a slightly-farther but
    # much-clearer scene wins over a same-day cloudy one.
    items.sort(key=lambda it: (it.properties.get("eo:cloud_cover", 100) / 10) + _distance_days(it))
    best = items[0]

    return SceneMatch(
        item_id=best.id,
        collection=COLLECTION,
        observed_date=str(best.datetime.date()),
        cloud_cover=float(best.properties.get("eo:cloud_cover", -1)),
        href_b04=best.assets["B04"].href,
        href_b08=best.assets["B08"].href,
        preview_href=preview_url(best.id),
    )


def preview_url(item_id: str) -> str:
    """A real true-colour PNG thumbnail of the actual satellite scene, so a
    human can see the same photo the numbers were computed from."""
    return (
        "https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png"
        f"?collection={COLLECTION}&item={item_id}&assets=visual"
        "&asset_bidx=visual|1,2,3&color_formula=Gamma+RGB+1.3+Saturation+1.4"
    )


def fetch_bands_live(lat: float, lng: float, target_date: str, grid_size: int) -> tuple[dict[str, np.ndarray], SceneMatch]:
    """Fetch real Sentinel-2 B04 (red) / B08 (NIR) reflectance for a small
    window around (lat, lng), resampled to grid_size x grid_size — the
    same shape the synthetic generator produces, so `ndvi.py` and
    everything after it needs zero changes."""
    try:
        import rasterio
        from rasterio.warp import transform_bounds
        from rasterio.windows import from_bounds
        from scipy.ndimage import zoom
    except ImportError as exc:  # pragma: no cover
        raise LiveFetchUnavailable(
            "rasterio/scipy not installed — run `pip install rasterio` (see requirements.txt)"
        ) from exc

    scene = search_scene(lat, lng, target_date)
    bbox_4326 = _bbox_around(lat, lng, TILE_SPAN_M)

    bands: dict[str, np.ndarray] = {}
    for band_name, href in (("B04", scene.href_b04), ("B08", scene.href_b08)):
        with rasterio.open(href) as src:
            bbox_native = transform_bounds("EPSG:4326", src.crs, *bbox_4326)
            window = from_bounds(*bbox_native, transform=src.transform)
            raw = src.read(1, window=window, boundless=True, fill_value=0).astype(np.float32)
            if raw.size == 0:
                raise LiveFetchUnavailable(f"Empty read window for {band_name} on scene {scene.item_id}")
            # Sentinel-2 L2A surface reflectance on Planetary Computer is
            # scaled by 10000 (i.e. 10000 == reflectance of 1.0).
            reflectance = np.clip(raw / 10000.0, 0.0, 1.0)
            zoom_factors = (grid_size / reflectance.shape[0], grid_size / reflectance.shape[1])
            bands[band_name] = zoom(reflectance, zoom_factors, order=1).astype(np.float32)

    return bands, scene
