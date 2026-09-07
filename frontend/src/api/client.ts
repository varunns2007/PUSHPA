import type {
  ForestArea, SatelliteObservation, ChangeEvent, Vehicle,
  TimberPermit, HistoricalIncident, RiskScoreBreakdown, Alert, SystemSettings
} from '../types';

const API_BASE = 'http://localhost:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getForests: () => fetchJson<ForestArea[]>(`${API_BASE}/forests`),
  getForest: (id: string) => fetchJson<ForestArea>(`${API_BASE}/forests/${id}`),
  getForestVegetation: (id: string) => fetchJson<any>(`${API_BASE}/forests/${id}/vegetation`),

  searchSatellite: (payload: any) => fetchJson<SatelliteObservation>(`${API_BASE}/satellite/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getObservations: (forestId?: string) => fetchJson<SatelliteObservation[]>(`${API_BASE}/satellite/observations${forestId ? `?forest_id=${forestId}` : ''}`),
  getNdviRaster: (forestId: string) => fetchJson<any>(`${API_BASE}/satellite/ndvi/${forestId}`),

  getChanges: (forestId?: string) => fetchJson<ChangeEvent[]>(`${API_BASE}/changes${forestId ? `?forest_id=${forestId}` : ''}`),
  getChangeEvent: (id: string) => fetchJson<ChangeEvent>(`${API_BASE}/changes/${id}`),
  processChange: (payload: any) => fetchJson<ChangeEvent>(`${API_BASE}/changes/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  getVehicles: () => fetchJson<Vehicle[]>(`${API_BASE}/vehicles`),
  getVehicle: (id: string) => fetchJson<Vehicle>(`${API_BASE}/vehicles/${id}`),
  simulateVehicles: () => fetchJson<Vehicle[]>(`${API_BASE}/vehicles/simulate`, { method: 'POST' }),

  analyzeRoute: (vehicleId: string) => fetchJson<any>(`${API_BASE}/routes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: vehicleId })
  }),

  getPermits: () => fetchJson<TimberPermit[]>(`${API_BASE}/permits`),
  getIncidents: (forestId?: string) => fetchJson<HistoricalIncident[]>(`${API_BASE}/incidents${forestId ? `?forest_id=${forestId}` : ''}`),

  calculateRisk: (payload: any) => fetchJson<RiskScoreBreakdown>(`${API_BASE}/risk/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  getAlerts: () => fetchJson<Alert[]>(`${API_BASE}/alerts`),
  updateAlertStatus: (alertId: string, status: string) => fetchJson<any>(`${API_BASE}/alerts/${alertId}/status?status=${status}`, { method: 'PUT' }),

  getSettings: () => fetchJson<SystemSettings>(`${API_BASE}/settings`),
  updateSettings: (payload: SystemSettings) => fetchJson<SystemSettings>(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
};
