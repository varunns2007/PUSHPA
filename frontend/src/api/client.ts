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
};


