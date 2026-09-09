// All data in this file is simulated for demonstration purposes.
// PUSHPA ships in DEMO MODE by default — no live satellite or vehicle feed is connected.

export const DEMO_MODE = true;

export const REGION = {
  name: "Anamalai Range, Western Ghats",
  code: "AGF-14",
  centerLat: 10.35,
  centerLng: 77.05,
  areaKm2: 1482.6,
};

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface Hotspot {
  id: string;
  label: string;
  risk: RiskLevel;
  densityBefore: number;
  densityAfter: number;
  changePct: number;
  areaKm2: number;
  confidence: number;
  lat: number;
  lng: number;
  status: "REQUIRES_VERIFICATION" | "UNDER_REVIEW" | "VERIFIED_FIELD_TEAM";
  detectedOn: string;
  /** Set when the missing trees in this clearing are a high-value species
   * (Red Sanders, Rosewood, Teak, Sandalwood) — shown with a dedicated
   * copper marker distinct from ordinary risk color, since this is the
   * single most actionable signal for enforcement teams. */
  valuableSpecies?: string;
}

export const HOTSPOTS: Hotspot[] = [
  { id: "HS-001", label: "Sector 7 — Ridge Line", risk: "HIGH", densityBefore: 84, densityAfter: 61, changePct: -23, areaKm2: 0.82, confidence: 91, lat: 10.372, lng: 77.041, status: "REQUIRES_VERIFICATION", detectedOn: "2026-06-02" },
  { id: "HS-002", label: "Sector 3 — River Bend", risk: "CRITICAL", densityBefore: 91, densityAfter: 58, changePct: -33, areaKm2: 1.14, confidence: 96, lat: 10.341, lng: 77.062, status: "UNDER_REVIEW", detectedOn: "2026-06-04", valuableSpecies: "Red Sanders" },
  { id: "HS-003", label: "Sector 11 — East Buffer", risk: "MODERATE", densityBefore: 77, densityAfter: 68, changePct: -12, areaKm2: 0.41, confidence: 78, lat: 10.389, lng: 77.089, status: "REQUIRES_VERIFICATION", detectedOn: "2026-06-05" },
  { id: "HS-004", label: "Sector 2 — Access Road", risk: "HIGH", densityBefore: 88, densityAfter: 66, changePct: -25, areaKm2: 0.63, confidence: 89, lat: 10.331, lng: 77.031, status: "VERIFIED_FIELD_TEAM", detectedOn: "2026-05-28", valuableSpecies: "Rosewood" },
  { id: "HS-005", label: "Sector 9 — South Slope", risk: "MODERATE", densityBefore: 80, densityAfter: 71, changePct: -11, areaKm2: 0.35, confidence: 74, lat: 10.361, lng: 77.075, status: "UNDER_REVIEW", detectedOn: "2026-06-06" },
  { id: "HS-006", label: "Sector 15 — North Corridor", risk: "LOW", densityBefore: 90, densityAfter: 86, changePct: -4, areaKm2: 0.18, confidence: 61, lat: 10.401, lng: 77.055, status: "REQUIRES_VERIFICATION", detectedOn: "2026-06-07" },
];

export interface Vehicle {
  id: string;
  type: "Truck" | "4x4" | "Motorbike";
  lat: number;
  lng: number;
  routeStatus: "NORMAL" | "UNUSUAL" | "STATIONARY";
  forestProximityKm: number;
  risk: RiskLevel;
  lastSeen: string;
}

export const VEHICLES: Vehicle[] = [
  { id: "A182", type: "Truck", lat: 10.348, lng: 77.048, routeStatus: "UNUSUAL", forestProximityKm: 1.2, risk: "MODERATE", lastSeen: "2 min ago" },
  { id: "B054", type: "4x4", lat: 10.365, lng: 77.071, routeStatus: "NORMAL", forestProximityKm: 3.4, risk: "LOW", lastSeen: "5 min ago" },
  { id: "C219", type: "Truck", lat: 10.336, lng: 77.036, routeStatus: "STATIONARY", forestProximityKm: 0.6, risk: "HIGH", lastSeen: "just now" },
  { id: "A177", type: "Motorbike", lat: 10.392, lng: 77.082, routeStatus: "NORMAL", forestProximityKm: 4.8, risk: "LOW", lastSeen: "11 min ago" },
];

export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];

// Forest density (%) and cover (km2) per month — demo trend showing gradual decline
export const TIMELINE_SERIES = MONTHS.map((m, i) => ({
  month: m,
  density: [82.4, 81.9, 80.8, 79.5, 77.6, 75.1][i],
  coverKm2: [1289, 1281, 1266, 1247, 1219, 1181][i],
  hotspots: [2, 2, 3, 4, 5, 6][i],
}));

export const DENSITY_BUCKETS = [
  { label: "VERY HIGH", range: "90–100%", pct: 18, color: "var(--color-forest-400)" },
  { label: "HIGH", range: "70–90%", pct: 34, color: "var(--color-forest-500)" },
  { label: "MEDIUM", range: "50–70%", pct: 27, color: "var(--color-gold-500)" },
  { label: "LOW", range: "25–50%", pct: 15, color: "var(--color-earth-400)" },
  { label: "VERY LOW", range: "0–25%", pct: 6, color: "var(--color-earth-700)" },
];

export const ANALYTICS_SUMMARY = {
  forestAreaKm2: 1181,
  canopyDensityPct: 75.1,
  vegetationHealthIndex: 0.68,
  forestLossKm2Ytd: 108.6,
  hotspotCount: 6,
  riskDistribution: [
    { label: "LOW", value: 1 },
    { label: "MODERATE", value: 2 },
    { label: "HIGH", value: 2 },
    { label: "CRITICAL", value: 1 },
  ],
};

export const REPORTS = [
  { id: "RPT-2026-06", title: "June 2026 — Forest Loss Assessment", date: "2026-06-07", pages: 14, status: "FINAL" },
  { id: "RPT-2026-05", title: "May 2026 — Change Detection Summary", date: "2026-05-31", pages: 11, status: "FINAL" },
  { id: "RPT-2026-Q2", title: "Q2 2026 — Hotspot Verification Log", date: "2026-06-08", pages: 22, status: "DRAFT" },
  { id: "RPT-2026-04", title: "April 2026 — Density Baseline Report", date: "2026-04-30", pages: 9, status: "FINAL" },
];

// ---------------------------------------------------------------------------
// Fallback data for backend-driven pages (Satellite Analysis, Timber Permits,
// Historical Incidents, Risk Analytics). Used only when the FastAPI backend
// in /backend is not reachable, so those pages still render something
// meaningful with zero setup. Shape mirrors the backend's JSON responses.
// ---------------------------------------------------------------------------
export const NDVI_TIERS_DEMO = [
  { tier: "BARE_SOIL_CLEARED", range: [0, 0.2], pct: 6.1 },
  { tier: "SPARSE_VEGETATION", range: [0.2, 0.4], pct: 9.4 },
  { tier: "MODERATE_DECIDUOUS", range: [0.4, 0.6], pct: 15.8 },
  { tier: "DENSE_EVERGREEN", range: [0.6, 0.8], pct: 47.2 },
  { tier: "PRISTINE_HIGH_CANOPY", range: [0.8, 1.0], pct: 21.5 },
];

export const SATELLITE_DEMO = {
  zone: "Nilgiri Biosphere Reserve — Zone A",
  before: { date: "2026-01-05", mean_ndvi: 0.7205, canopy_density_pct: 86.0 },
  after: { date: "2026-06-04", mean_ndvi: 0.319, canopy_density_pct: 66.0 },
  tiers: NDVI_TIERS_DEMO,
};

export interface PermitRecord {
  vehicle_id: string;
  permit_id: string | null;
  holder: string | null;
  authorized_species: string | null;
  approved_route: string | null;
  expiry: string | null;
  status: string;
  valid: boolean;
  reason: string;
}

export const PERMITS_DEMO: PermitRecord[] = [
  { vehicle_id: "TN01AB1234", permit_id: null, holder: null, authorized_species: null, approved_route: null, expiry: null, status: "UNPERMITTED", valid: false, reason: "No permit on file for this registration number." },
  { vehicle_id: "TN09CJ5521", permit_id: "PMT-2026-0042", holder: "Sundaram Timber Traders", authorized_species: "Teak", approved_route: "NH-181 Coimbatore–Pollachi Corridor", expiry: "2026-12-31", status: "VALID", valid: true, reason: "Permit valid and in good standing." },
  { vehicle_id: "KL07BQ9012", permit_id: "PMT-2025-1187", holder: "Periyar Forest Produce Co.", authorized_species: "Rosewood", approved_route: "SH-8 Kumily–Vandiperiyar Route", expiry: "2025-07-01", status: "EXPIRED", valid: false, reason: "Permit expired on 2025-07-01." },
  { vehicle_id: "TN23AZ7788", permit_id: "PMT-2026-0091", holder: "Nilgiri Sawmill Cooperative", authorized_species: "Sandalwood", approved_route: "NH-67 Ooty–Gudalur Highway", expiry: "2026-10-15", status: "ROUTE_MISMATCH", valid: false, reason: "Vehicle transit route does not match the approved corridor on file." },
];

export interface HistoricalIncident {
  id: string;
  zone_id: string;
  lat: number;
  lng: number;
  date: string;
  species: string;
}

export const INCIDENTS_DEMO: HistoricalIncident[] = [
  { id: "INC-0001", zone_id: "ZONE-A", lat: 11.409, lng: 76.701, date: "2023-11-02", species: "Rosewood" },
  { id: "INC-0002", zone_id: "ZONE-A", lat: 11.404, lng: 76.689, date: "2024-01-17", species: "Teak" },
  { id: "INC-0003", zone_id: "ZONE-A", lat: 11.411, lng: 76.696, date: "2024-03-05", species: "Red Sanders" },
  { id: "INC-0004", zone_id: "ZONE-A", lat: 11.402, lng: 76.690, date: "2024-06-21", species: "Teak" },
  { id: "INC-0005", zone_id: "ZONE-A", lat: 11.408, lng: 76.694, date: "2024-09-14", species: "Rosewood" },
  { id: "INC-0006", zone_id: "ZONE-A", lat: 11.406, lng: 76.692, date: "2025-01-09", species: "Teak" },
  { id: "INC-0007", zone_id: "ZONE-A", lat: 11.410, lng: 76.698, date: "2025-05-30", species: "Red Sanders" },
  { id: "INC-0008", zone_id: "ZONE-A", lat: 11.403, lng: 76.691, date: "2025-08-12", species: "Rosewood" },
  { id: "INC-0009", zone_id: "ZONE-B", lat: 10.348, lng: 77.048, date: "2024-04-11", species: "Teak" },
  { id: "INC-0010", zone_id: "ZONE-B", lat: 10.352, lng: 77.053, date: "2024-12-02", species: "Rosewood" },
  { id: "INC-0011", zone_id: "ZONE-C", lat: 9.460, lng: 77.235, date: "2025-02-19", species: "Teak" },
];

export interface RiskFactor {
  factor: string;
  points: number;
  max_points: number;
  triggered: boolean;
  detail: string;
}

export interface RiskResult {
  vehicle_id: string;
  risk_score: number;
  rating: RiskLevel | "CRITICAL";
  breakdown: RiskFactor[];
}

export const RISK_RESULTS_DEMO: RiskResult[] = [
  {
    vehicle_id: "TN01AB1234",
    risk_score: 91,
    rating: "CRITICAL",
    breakdown: [
      { factor: "Change Severity", points: 30, max_points: 30, triggered: true, detail: "Nearest tile shows 59.2% canopy loss." },
      { factor: "Permit Violation", points: 25, max_points: 25, triggered: true, detail: "No permit on file for this registration number." },
      { factor: "Spatial Proximity", points: 20, max_points: 20, triggered: true, detail: "Vehicle is 2.3km from the nearest change polygon." },
      { factor: "Route Anomaly", points: 15, max_points: 15, triggered: true, detail: "Vehicle is deviating onto an unmonitored interior track." },
      { factor: "Historical Hotspot", points: 10, max_points: 10, triggered: true, detail: "8 prior illegal-felling incidents recorded within 3km." },
    ],
  },
  {
    vehicle_id: "TN09CJ5521",
    risk_score: 12,
    rating: "LOW",
    breakdown: [
      { factor: "Change Severity", points: 0, max_points: 30, triggered: false, detail: "No significant canopy loss detected nearby." },
      { factor: "Permit Violation", points: 0, max_points: 25, triggered: false, detail: "Permit valid and in good standing." },
      { factor: "Spatial Proximity", points: 0, max_points: 20, triggered: false, detail: "No change polygons in range." },
      { factor: "Route Anomaly", points: 0, max_points: 15, triggered: false, detail: "Vehicle is travelling a recognized transit corridor." },
      { factor: "Historical Hotspot", points: 12, max_points: 10, triggered: false, detail: "1 prior incident recorded nearby." },
    ],
  },
  {
    vehicle_id: "KL07BQ9012",
    risk_score: 46,
    rating: "MODERATE",
    breakdown: [
      { factor: "Change Severity", points: 0, max_points: 30, triggered: false, detail: "No significant canopy loss detected nearby." },
      { factor: "Permit Violation", points: 25, max_points: 25, triggered: true, detail: "Permit expired on 2025-07-01." },
      { factor: "Spatial Proximity", points: 0, max_points: 20, triggered: false, detail: "No change polygons in range." },
      { factor: "Route Anomaly", points: 11, max_points: 15, triggered: false, detail: "Vehicle is travelling a recognized transit corridor." },
      { factor: "Historical Hotspot", points: 10, max_points: 10, triggered: true, detail: "1 prior incident recorded within 3km." },
    ],
  },
];

export function riskColor(risk: RiskLevel) {
  switch (risk) {
    case "LOW": return "var(--color-forest-400)";
    case "MODERATE": return "var(--color-gold-500)";
    case "HIGH": return "var(--color-earth-400)";
    case "CRITICAL": return "var(--color-earth-500)";
  }
}
