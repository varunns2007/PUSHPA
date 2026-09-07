# 🌳 PUSHPA — Predictive Unified System for Forest Protection & Anti-Smuggling

> **AI-Powered Geospatial Intelligence & Anti-Smuggling Platform for Forest Regional Monitoring**

PUSHPA is a production-style, software-based web application that monitors forest regions using satellite imagery (Copernicus Sentinel-2), detects vegetation/density changes, extracts forest-clearing polygons, analyzes nearby timber transport routes, verifies legal timber permits, correlates vehicle movements with historical incidents, and computes an explainable **Investigation Risk Score (0–100)** to prioritize field verification.

---

## 🚀 Key Features

* **Copernicus Sentinel-2 Data Pipeline**: Searches and ingests Sentinel-2 Level-2A imagery, processes B04 (Red) & B08 (Near Infrared) bands, applies SCL cloud/shadow masking, and calculates NDVI rasters `(B08 - B04) / (B08 + B04)`.
* **Forest Density Analyzer**: Classifies pixels into Non-vegetation, Sparse, Moderate, and Dense vegetation tiers with configurable thresholds.
* **Before vs After NDVI Change Detection**: Computes vegetation decline deltas and extracts contiguous geographic polygons (`CHG_POLY_001`) with area (ha), centroids, and vegetation loss percentage.
* **Vehicle Intelligence & Telemetry**: Monitors timber vehicle GPS coordinates, speed, heading, origin, destination, and evaluates route proximity to forest clearing polygons.
* **Timber Permit Verification**: Checks legal transport authorization against the `timber_permits` registry.
* **Explainable AI Risk Engine**: Generates an **Investigation Risk Score (0–100)** with transparent contributing factor breakdowns (e.g. `+27 Change severity`, `+20 Missing permit`, `+18 Density loss`, `+14 Route anomaly`, `+8 Historical hotspot`, `+4 Spatial proximity`).
* **3D Forest Density & Terrain View**: Three.js 3D terrain elevation surface rendering vegetation density textures and highlighting forest clearing depression zones.
* **GIS Command Dashboard**: Dark-mode interface with 12 toggleable map layers, live alert ticker, before/after comparison slider, and an Officer Investigation Panel.
* **PUSHPA DEMO INCIDENT**: Preconfigured 10-step hackathon demonstration executing the entire intelligence story end-to-end.

---

## 🏗️ System Architecture

```text
PUSHPA/
├── frontend/             # React + TypeScript + Vite + Tailwind CSS + Leaflet + Three.js
│   ├── src/
│   │   ├── components/   # Navbar, StatsOverview, AlertsList, InvestigationModal, SettingsModal, DemoScenarioBar
│   │   ├── maps/         # MainGISMap (12 layers), LayerControls, SplitComparisonMap
│   │   ├── three/        # TerrainForestScene (3D Three.js view)
│   │   ├── pages/        # Dashboard, Satellite, Changes, Vehicles, Permits, Incidents, Risk Engine
│   │   ├── api/          # Client fetch service
│   │   └── types/        # TypeScript interfaces
├── backend/              # FastAPI + Pydantic + SQLite/PostGIS + NumPy/OpenCV/GeoPandas
│   ├── app/
│   │   ├── api/          # REST Endpoints for forests, satellite, changes, vehicles, permits, risk, alerts
│   │   ├── satellite/    # Copernicus Sentinel-2 API client & synthetic band generator
│   │   ├── geospatial/   # Density analyzer, change detector, polygon extractor
│   │   ├── vehicles/     # Vehicle telemetry simulator & route anomaly engine
│   │   ├── risk/         # Explainable Illegal Logging Risk Engine (0-100)
│   │   ├── alerts/       # Real-time alert engine
│   │   └── database/     # DB store models & SQLite fallback
├── scripts/              # Demo seeder & satellite batch processor
│   ├── generate_demo_data.py
│   └── process_satellite.py
└── .env.example          # Environment variables template
```

---

## 💻 Environment Variables Configuration

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Key configuration parameters:
* `GOOGLE_MAPS_API_KEY`: Key for Google Maps Platform integrations.
* `COPERNICUS_CLIENT_ID`: Client ID for Copernicus Data Space Ecosystem API.
* `COPERNICUS_CLIENT_SECRET`: Client Secret for Copernicus API.
* `DATABASE_URL`: PostgreSQL + PostGIS URL or SQLite fallback (`sqlite:///./pushpa.db`).
* `SIMULATION_MODE`: Set to `True` for demo telemetry simulation.

---

## 🛠️ Windows Installation & Setup Guide

### 1. Prerequisites
- Python 3.11+
- Node.js v20+ / npm

### 2. Backend Setup & Startup
```powershell
# Navigate to backend folder
cd backend

# Install Python requirements
python -m pip install -r requirements.txt

# Seed demo dataset
python ../scripts/generate_demo_data.py

# Start FastAPI Backend Server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API docs available at:* `http://localhost:8000/api/docs`

### 3. Frontend Setup & Startup
```powershell
# In a new terminal, navigate to frontend folder
cd frontend

# Install npm dependencies
npm install

# Start Vite Development Server
npm run dev
```
*Frontend GIS Dashboard available at:* `http://localhost:5173/`

---

## 🎬 Running the DEMO INCIDENT Scenario

1. Open `http://localhost:5173/` in your browser.
2. Click the red **`[ DEMO INCIDENT ]`** button in the top header.
3. Step through the 10 automated intelligence steps:
   - **Step 1-4**: Ingests Sentinel-2 satellite observation, computes NDVI drop (-59.2%), and extracts 2.73 ha clearing polygon `CHG_POLY_001`.
   - **Step 5-8**: Correlates moving timber vehicle `TN01AB1234`, identifies route deviation, verifies missing permit, and matches 8 historical incidents.
   - **Step 9-10**: Risk Engine calculates **91/100 (CRITICAL)** and automatically opens the **Officer Investigation Panel for #CHG001**.

---

## ⚖️ Ethical & Legal Boundary

PUSHPA is an intelligence and prioritization platform. The system **NEVER** automatically declares an event illegal or issues legal determinations. Alerts are explicitly framed as **Potential Illegal Logging / Suspicious Forest Change / Investigation Required** to assist forest officers in prioritizing field verification.

---

## 🛡️ License & Credits

Built for Forest Regional Protection & Anti-Smuggling Hackathons.
Satellite imagery source: Copernicus Sentinel-2 (European Space Agency / Copernicus Data Space Ecosystem).
