// Thin REST client for the PUSHPA FastAPI backend (see /backend).
//
// The frontend must keep working with zero setup, so every call here is
// wrapped to fail soft: if the backend isn't running (the default state),
// callers get { ok: false } instead of a thrown error, and pages fall back
// to the bundled demo data in src/data/mockData.ts.

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8000";
const TIMEOUT_MS = 4000;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function checkHealth() {
  return request<{ status: string; mode: string }>("/api/health");
}

export async function getForests() {
  return request<{ zones: any[] }>("/api/forests");
}

export async function getNdvi(zoneId: string, date?: string, severity?: number) {
  const q = new URLSearchParams({ zone_id: zoneId, ...(date ? { date } : {}), ...(severity !== undefined ? { severity: String(severity) } : {}) });
  return request<any>(`/api/satellite/ndvi?${q}`);
}

export async function compareNdvi(zoneId: string, beforeDate?: string, afterDate?: string, severity?: number) {
  const q = new URLSearchParams({
    zone_id: zoneId,
    ...(beforeDate ? { before_date: beforeDate } : {}),
    ...(afterDate ? { after_date: afterDate } : {}),
    ...(severity !== undefined ? { severity: String(severity) } : {}),
  });
  return request<any>(`/api/satellite/compare?${q}`);
}

export async function detectChanges(zoneId: string, beforeDate?: string, afterDate?: string, severity?: number) {
  return post<any>("/api/changes/detect", { zone_id: zoneId, before_date: beforeDate, after_date: afterDate, severity });
}

export async function listChanges() {
  return request<{ polygons: any[] }>("/api/changes");
}

export async function listVehicles() {
  return request<{ vehicles: any[] }>("/api/vehicles");
}

export async function simulateVehicleTick(vehicleId: string) {
  return post<any>(`/api/vehicles/${vehicleId}/simulate-tick`);
}

export async function listPermits() {
  return request<{ permits: any[] }>("/api/permits");
}

export async function getPermit(vehicleId: string) {
  return request<any>(`/api/permits/${vehicleId}`);
}

export async function listRisk() {
  return request<{ results: any[] }>("/api/risk");
}

export async function getRisk(vehicleId: string, dispatchAlert = false) {
  return request<any>(`/api/risk/${vehicleId}?dispatch_alert=${dispatchAlert}`);
}

export async function listAlerts() {
  return request<{ alerts: any[] }>("/api/alerts");
}

export async function listIncidents(zoneId?: string) {
  return request<{ incidents: any[] }>(`/api/incidents${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export async function runDemoScenario() {
  return post<any>("/api/demo/run-scenario");
}

// Real (or synthetic-fallback) satellite compare, including the backend's
// plain_language block — see backend/app/explain/plain_language.py. When
// USE_LIVE_SATELLITE=1 on the backend, this is genuine Sentinel-2 imagery
// via Microsoft Planetary Computer; the response's `after.source.source`
// field says which ("live" / "live_unavailable_fallback" / "synthetic").
export async function compareSatellitePlain(zoneId: string, beforeDate: string, afterDate: string) {
  const q = new URLSearchParams({ zone_id: zoneId, before_date: beforeDate, after_date: afterDate });
  return request<any>(`/api/satellite/compare?${q}`);
}

export async function getWatchStatus() {
  return request<any>("/api/watch/status");
}

export async function getWatchHistory(zoneId?: string) {
  return request<{ history: any[] }>(`/api/watch/history${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export function subscribeAlerts(onAlert: (alert: any) => void): () => void {
  try {
    const es = new EventSource(`${BASE_URL}/api/alerts/stream`);
    es.addEventListener("alert", (e: MessageEvent) => {
      try {
        onAlert(JSON.parse(e.data));
      } catch {
        /* ignore malformed event */
      }
    });
    return () => es.close();
  } catch {
    return () => {};
  }
}

// --- Multi-Agent AI Interdiction & Police Dispatch ------------------------
export async function ingestTelemetry(payload: {
  vehicle_id: string;
  timestamp?: string;
  lat: number;
  lng: number;
  heading_deg?: number;
  speed_kmh?: number;
  cargo_weight_kg?: number;
  declared_species?: string;
  source?: string;
}) {
  return post<any>("/api/telemetry/ingest", payload);
}

export async function getPoliceDispatchLogs() {
  return request<{ count: number; dispatches: any[] }>("/api/police-stations/dispatch-log");
}

export async function getPoliceStations() {
  return request<{ count: number; police_stations: any[]; strategic_chokepoints: any[] }>("/api/police-stations/list");
}

export async function listPoliceStations(zoneId?: string) {
  return request<{ stations: any[] }>(`/api/police-stations${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export async function nearbyPoliceStations(lat: number, lng: number, limit = 3) {
  const q = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: String(limit) });
  return request<{ stations: any[] }>(`/api/police-stations/nearby?${q}`);
}

export async function policeDispatchLog(limit = 50) {
  return request<{ dispatches: any[] }>(`/api/police-stations/dispatch-log?limit=${limit}`);
}

export async function getConvoySignatures() {
  return request<{ signatures: any[] }>("/api/convoy/signatures");
}

export async function getVehicleHistory(vehicleId: string) {
  return request<{ vehicle_id: string; history: any[] }>(`/api/vehicles/${vehicleId}/history`);
}

export const api = {
  checkHealth,
  getForests,
  getNdvi,
  compareNdvi,
  detectChanges,
  processChange: async (body: any) => {
    const res = await detectChanges(body.forest_id || "zone-1", body.date_before, body.date_after);
    return res.ok ? res.data : null;
  },
  listChanges,
  listVehicles,
  simulateVehicleTick,
  listPermits,
  getPermit,
  listRisk,
  getRisk,
  listAlerts,
  listIncidents,
  runDemoScenario,
  subscribeAlerts,
  compareSatellitePlain,
  getWatchStatus,
  getWatchHistory,
  ingestTelemetry,
  getPoliceDispatchLogs,
  getPoliceStations,
  listPoliceStations,
  nearbyPoliceStations,
  policeDispatchLog,
  getConvoySignatures,
  getVehicleHistory,
};

