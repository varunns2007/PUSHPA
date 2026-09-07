# PUSHPA System Architecture Documentation
**Predictive Unified System for Forest Protection & Anti-Smuggling**

## 1. System Overview
PUSHPA is an intelligence and decision-support platform that fuses Copernicus Sentinel-2 multispectral satellite observations with vehicle GPS telemetry, timber transport permit registries, and spatial-temporal historical logging incident data to identify potential unauthorized forest disturbances and correlate transport anomalies.

```
                    DATA SOURCES
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
  Sentinel-2            GPS             Permits
 (B04, B08, SCL)    (Telemetry)        (Registry)
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
                  INGESTION LAYER
                         ↓
                  JOB / WORK QUEUE
                         ↓
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
 Satellite           Vehicle           Permit
 Processing          Processing        Processing
 (NDVI & SCL)       (Routes & Polys)  (Temporal & ID)
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
                 PERSISTENCE LAYER
               (PostGIS & SQLite DB)
                         ↓
              DISTURBANCE DETECTION
                         ↓
                 TEMPORAL ANALYSIS
                         ↓
               POLYGON EXTRACTION
        (Projected Geodesic Area in ha)
                         ↓
             SPATIAL + TEMPORAL
                CORRELATION
                         ↓
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
   Vehicle             Permit          Historical
   Evidence           Evidence          Evidence
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
                    RISK ENGINE
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
          RISK SCORE            CONFIDENCE
            0–100                 0–100
              │                     │
              └──────────┬──────────┘
                         ↓
                  DISTURBANCE EVENT
                         ↓
                  INVESTIGATION CASE
                         ↓
                   ALERT ENGINE
              (Spatial Deduplication)
                         ↓
                    FASTAPI API
                         ↓
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Leaflet        Three.js      Officer Hub
      (2D GIS)       (3D Scene)    (Dossier & Audit)
```

## 2. Risk Engine Mathematics
Risk is computed as a standardized 0–100 integer with six explicit factor components bounded strictly by their configured weights:

| Component Factor | Max Weight (%) | Ruleset |
| :--- | :--- | :--- |
| **Forest Change Severity** | 30 | High $\Delta\text{NDVI}$ drop ($>50\% \to 30$, $>30\% \to 22$, $>15\% \to 12$) |
| **Vegetation Loss Area** | 20 | Disturbance area in ha ($>2.5\text{ ha} \to 20$, $>1.0\text{ ha} \to 15$, $>0\text{ ha} \to 8$) |
| **Permit Anomaly** | 20 | `NOT_FOUND` $\to 20$, `EXPIRED`/`REVOKED` $\to 17$, `VALID`/`UNKNOWN` $\to 0$ |
| **Route Anomaly** | 15 | Off-corridor deviation ($>10\text{ km} \to 12$, $>2\text{ km} \to 6$, mismatch $\to 15$, compliant $\to 0$) |
| **Historical Risk** | 10 | Spatial-temporal exponential half-life decay ($T_{1/2} = 365\text{ days}, R_{\max} = 10\text{ km}$) |
| **Spatial Proximity** | 5 | Minimum distance to polygon boundary ($\le 3\text{ km} \to 5$, $\le 8\text{ km} \to 2$) |
| **Total Score** | **100** | $\min(100, \sum c_i)$ |

## 3. Confidence Separation
Confidence (0–100) measures data completeness and sensor quality. External source timeouts or missing records set status to `UNKNOWN` and reduce confidence rather than penalizing risk.

## 4. Geospatial & Scientific Pipeline
- **Rasters**: Copernicus Sentinel-2 Red (B04), NIR (B08), and Scene Classification (SCL) cloud/shadow masking.
- **$\Delta\text{NDVI}$ Calculation**: Normalized Difference Vegetation Index difference with morphological opening and closing.
- **Polygonization**: Azimuthal Equidistant projection to calculate planar metric area ($m^2 \to \text{ha}$) and filter candidates $< 0.05\text{ ha}$.
- **Vehicle Correlation**: Exact minimum distance from vehicle point/route to disturbance polygon boundary.
