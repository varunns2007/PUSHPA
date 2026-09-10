# PUSHPA map and 3D visual fixes

## Map
- The base layer is Esri World Imagery and is fetched as geographic XYZ tiles.
- The map center is Anamalai Range / Western Ghats (10.35, 77.05).
- Forest boundary, rivers, routes, hotspots and vehicle markers are projected from latitude/longitude into the same Web Mercator coordinate system as the satellite tiles.
- During pan, zoom and resize, overlays and imagery use the same projection, so the red detection polygon stays geographically anchored instead of sliding independently.
- The basemap is intentionally brightened/saturated for readability while keeping the existing PUSHPA HUD.
- The map attribution identifies the imagery provider.

## 3D
- The previous near-black lighting was replaced with hemisphere, sun, cool fill and warm accent lighting.
- ACES tone mapping and higher exposure make the forest readable on normal laptop displays.
- The scene now contains a brighter terrain surface, mountain silhouettes, a blue river, layered canopy vegetation, coloured change patches, inspection markers and atmospheric particles.
- The 3D view remains a **visual terrain/canopy model**; it is not claimed to be a literal photogrammetric reconstruction from satellite imagery.

## Data integrity
The satellite basemap is real imagery, but the PUSHPA hotspots/routes shown by the demo UI are application/demo overlays. They should not be presented as verified real-world incidents unless connected to the backend's live detection data.
