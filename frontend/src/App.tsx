import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DemoScenarioBar } from './components/DemoScenarioBar';
import { StatsOverview } from './components/StatsOverview';
import { AlertsList } from './components/AlertsList';
import { InvestigationModal } from './components/InvestigationModal';
import { SettingsModal } from './components/SettingsModal';
import { PoliceDispatchModal } from './components/PoliceDispatchModal';
import { DailyComparisonPanel } from './components/DailyComparisonPanel';

import { MainGISMap } from './maps/MainGISMap';
import { LayerControls } from './maps/LayerControls';
import type { LayerToggles } from './maps/LayerControls';
import { SplitComparisonMap } from './maps/SplitComparisonMap';
import { TerrainForestScene } from './three/TerrainForestScene';
import { HeatmapDensity3DScene } from './three/HeatmapDensity3DScene';

import { SatelliteAnalysisPage } from './pages/SatelliteAnalysisPage';
import { ChangeDetectionPage } from './pages/ChangeDetectionPage';
import { VehicleIntelligencePage } from './pages/VehicleIntelligencePage';
import { TimberPermitsPage } from './pages/TimberPermitsPage';
import { HistoricalIncidentsPage } from './pages/HistoricalIncidentsPage';
import { RiskAnalyticsPage } from './pages/RiskAnalyticsPage';

import { api } from './api/client';
import type {
  ForestArea, ChangeEvent, ChangePolygon, Vehicle,
  TimberPermit, HistoricalIncident, Alert, SystemSettings
} from './types';

interface HeatmapCell {
  col: number; row: number;
  densityBefore: number; densityToday: number; loss: number;
}
interface PoliceStation {
  name: string; distKm: number; lat: number; lng: number;
}

const FOREST_NAME = 'Nilgiri Biosphere Reserve (Zone A)';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // ── Data state ─────────────────────────────────────────────────
  const [forests, setForests]             = useState<ForestArea[]>([]);
  const [changes, setChanges]             = useState<ChangeEvent[]>([]);
  const [changePolygons, setChangePolygons] = useState<ChangePolygon[]>([]);
  const [vehicles, setVehicles]           = useState<Vehicle[]>([]);
  const [permits, setPermits]             = useState<TimberPermit[]>([]);
  const [incidents, setIncidents]         = useState<HistoricalIncident[]>([]);
  const [alerts, setAlerts]               = useState<Alert[]>([]);
  const [settings, setSettings]           = useState<SystemSettings | null>(null);

  // ── Modal / selection state ────────────────────────────────────
  const [selectedAlert, setSelectedAlert]               = useState<Alert | null>(null);
  const [selectedChangeEvent, setSelectedChangeEvent]   = useState<ChangeEvent | null>(null);
  const [selectedForest, setSelectedForest]             = useState<ForestArea | null>(null);
  const [flyToCenter, setFlyToCenter]                   = useState<[number, number] | null>(null);
  const [isSettingsOpen, setIsSettingsOpen]             = useState<boolean>(false);

  // ── Police dispatch state ──────────────────────────────────────
  const [dispatchCell, setDispatchCell]         = useState<HeatmapCell | null>(null);
  const [dispatchStations, setDispatchStations] = useState<PoliceStation[]>([]);
  const [dispatchedAlertIds, setDispatchedAlertIds] = useState<string[]>([]);

  // ── Demo state ────────────────────────────────────────────────
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStep, setDemoStep]           = useState<number>(1);

  // ── Layer toggles ─────────────────────────────────────────────
  const [layers, setLayers] = useState<LayerToggles>({
    forestBoundaries:  true,
    basemapMode:       'google-hybrid',
    denseTreeHeatmap:  true,
    treesCutHeatmap:   true,
    ndviOverlay:       false,
    vegDensity:        true,
    changePolygons:    true,
    historicalIncidents: true,
    roads:             true,
    vehicles:          true,
    vehicleRoutes:     true,
    highRiskZones:     true,
    permittedLocations: true,
  });

  // ── Load data ─────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [fData, cData, vData, pData, iData, aData, sData] = await Promise.all([
        api.getForests(),
        api.getChanges(),
        api.getVehicles(),
        api.getPermits(),
        api.getIncidents(),
        api.getAlerts(),
        api.getSettings(),
      ]);
      setForests(fData);
      setChanges(cData);
      setVehicles(vData);
      setPermits(pData);
      setIncidents(iData);
      setAlerts(aData);
      setSettings(sData);
      setChangePolygons(cData.flatMap(c => c.polygons));
    } catch (e) {
      console.warn('Backend not available — running in UI demo mode', e);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleToggleLayer = (key: keyof LayerToggles) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSelectBasemap = (mode: 'google-hybrid' | 'google-roads' | 'carto-dark') =>
    setLayers(prev => ({ ...prev, basemapMode: mode }));

  const handleStartDemo = () => { setIsDemoRunning(true); setDemoStep(1); setActiveTab('dashboard'); };

  const handlePoliceDispatch = useCallback((cell: HeatmapCell, stations: PoliceStation[]) => {
    setDispatchCell(cell);
    setDispatchStations(stations);
  }, []);

  const handleDispatchConfirm = useCallback((stationName: string) => {
    console.log(`🚔 Dispatched to: ${stationName}`);
    // Mark first alert as dispatched for demo
    if (alerts.length > 0) {
      setDispatchedAlertIds(prev => [...prev, alerts[0].id]);
    }
  }, [alerts]);

  const handleCloseDispatch = useCallback(() => {
    setDispatchCell(null);
    setDispatchStations([]);
  }, []);

  const demoStepsList = [
    'Querying Copernicus Sentinel-2 for Nilgiri Biosphere Zone A',
    'Calculating Vegetation Density Index (NDVI B08 & B04)',
    'Before vs After NDVI: 59.2% vegetation drop detected',
    'Extracted Change Polygon CHG_POLY_001 (2.73 ha clearing)',
    'Tracked Vehicle TN01AB1234 detected 2.3 km from zone',
    'Route Analysis: Vehicle intersects forest change zone',
    'Timber Permit Verification: NO VALID PERMIT for TN01AB1234',
    'Historical Correlation: Area matches 8 prior incidents',
    'AI Risk Engine: Investigation Score 91/100 (CRITICAL)',
    '🚨 CRITICAL ALERT — Opening Officer Investigation Panel',
  ];

  const handleNextDemoStep = () => {
    if (demoStep < 10) {
      setDemoStep(prev => prev + 1);
    } else {
      setFlyToCenter([11.5855, 76.5520]);
      if (alerts.length > 0) setSelectedAlert(alerts[0]);
    }
  };

  const handleSimulateVehicleStep = async () => {
    try { const updated = await api.simulateVehicles(); setVehicles(updated); }
    catch (e) { console.error(e); }
  };

  const unpermittedCount = vehicles.filter(v => v.permit_status !== 'VALID').length;
  const criticalCount    = alerts.filter(a => a.severity === 'CRITICAL').length;
  const avgRisk = 78;

  // ── Main GIS map reused in two tabs ───────────────────────────
  const mainMap = (
    <MainGISMap
      forests={forests}
      changePolygons={changePolygons}
      vehicles={vehicles}
      incidents={incidents}
      layers={layers}
      selectedForest={selectedForest}
      onSelectPolygon={(poly) => {
        const parentEvent = changes.find(c => c.polygons.some(p => p.id === poly.id));
        setSelectedChangeEvent(parentEvent || null);
        if (alerts.length > 0) setSelectedAlert(alerts[0]);
      }}
      onSelectVehicle={() => setActiveTab('vehicles')}
      flyToCenter={flyToCenter}
    />
  );

  return (
    <div className="min-h-screen flex flex-col text-slate-100 relative">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemo={handleStartDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        liveStatus={true}
      />

      {/* Demo bar */}
      {isDemoRunning && (
        <DemoScenarioBar
          currentStep={demoStep}
          totalSteps={10}
          stepName={demoStepsList[demoStep - 1]}
          onNext={handleNextDemoStep}
          onClose={() => setIsDemoRunning(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 space-y-4 max-w-[1900px] w-full mx-auto relative z-10">
        {/* Stats */}
        <StatsOverview
          forestsCount={forests.length || 7}
          changesCount={changes.length || 12}
          criticalAlertsCount={criticalCount || 4}
          vehiclesCount={vehicles.length || 11}
          unpermittedCount={unpermittedCount || 6}
          avgRisk={avgRisk}
        />

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[580px] animate-fade-slide-up">
            <div className="lg:col-span-3 h-[580px] relative">
              {mainMap}
            </div>
            <div className="lg:col-span-1 space-y-4 flex flex-col h-[580px]">
              <LayerControls layers={layers} onToggle={handleToggleLayer} onSelectBasemap={handleSelectBasemap} />
              <div className="flex-1 overflow-hidden">
                <AlertsList
                  alerts={alerts}
                  dispatchedAlertIds={dispatchedAlertIds}
                  onSelectAlert={(alt) => {
                    setSelectedAlert(alt);
                    setFlyToCenter([alt.location_lat, alt.location_lng]);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── FOREST MONITORING ── */}
        {activeTab === 'forests' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[580px] animate-fade-slide-up">
            <div className="lg:col-span-3 h-full">{mainMap}</div>
            <div className="lg:col-span-1 gis-glass p-4 rounded-xl border border-slate-800 space-y-3 overflow-y-auto">
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-emerald-400 text-glow-green">
                FOREST REGIONS ({forests.length})
              </h3>
              <div className="space-y-2">
                {forests.map(f => (
                  <div key={f.id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-xs hover:border-emerald-900/50 transition-colors">
                    <div className="flex justify-between font-bold text-slate-100">
                      <span>{f.name}</span>
                      <span className="text-emerald-400 font-orbitron text-[10px]">{f.code}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Area: {f.total_area_ha} ha</div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Dense Veg: {f.dense_veg_pct}%</span>
                      <span className="font-bold text-red-400">Risk: {f.current_risk_score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SATELLITE ANALYSIS ── */}
        {activeTab === 'satellite' && (
          <div className="animate-fade-slide-up">
            <SatelliteAnalysisPage forests={forests} onSelectForest={setSelectedForest} />
          </div>
        )}

        {/* ── CHANGE DETECTION ── */}
        {activeTab === 'changes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px] animate-fade-slide-up">
            <SplitComparisonMap forestName={FOREST_NAME} />
            <ChangeDetectionPage
              forests={forests}
              changes={changes}
              onSelectPolygon={() => { if (alerts.length > 0) setSelectedAlert(alerts[0]); }}
            />
          </div>
        )}

        {/* ── 3D HEATMAP (NEW) ── */}
        {activeTab === 'heatmap-3d' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[680px] animate-fade-slide-up">
            {/* Main 3D heatmap (2/3 width) */}
            <div className="lg:col-span-2 h-full">
              <HeatmapDensity3DScene
                forestName={FOREST_NAME}
                onPoliceDispatch={handlePoliceDispatch}
              />
            </div>
            {/* Daily comparison panel (1/3 width) */}
            <div className="lg:col-span-1 h-full">
              <DailyComparisonPanel forestName={FOREST_NAME} />
            </div>
          </div>
        )}

        {/* ── 3D FOREST VIEW (legacy) ── */}
        {activeTab === '3d-forest' && (
          <div className="h-[600px] animate-fade-slide-up">
            <TerrainForestScene forestName={FOREST_NAME} />
          </div>
        )}

        {/* ── VEHICLE INTELLIGENCE ── */}
        {activeTab === 'vehicles' && (
          <div className="animate-fade-slide-up">
            <VehicleIntelligencePage
              vehicles={vehicles}
              permits={permits}
              onSimulateStep={handleSimulateVehicleStep}
              onSelectVehicle={(v) => {
                setFlyToCenter([v.current_lat, v.current_lng]);
                setActiveTab('dashboard');
              }}
            />
          </div>
        )}

        {/* ── ROUTES ── */}
        {activeTab === 'routes' && (
          <div className="animate-fade-slide-up">
            <VehicleIntelligencePage
              vehicles={vehicles}
              permits={permits}
              onSimulateStep={handleSimulateVehicleStep}
              onSelectVehicle={() => {}}
            />
          </div>
        )}

        {/* ── PERMITS ── */}
        {activeTab === 'permits' && (
          <div className="animate-fade-slide-up">
            <TimberPermitsPage permits={permits} />
          </div>
        )}

        {/* ── INCIDENTS ── */}
        {activeTab === 'incidents' && (
          <div className="animate-fade-slide-up">
            <HistoricalIncidentsPage incidents={incidents} />
          </div>
        )}

        {/* ── RISK ENGINE ── */}
        {activeTab === 'risk' && (
          <div className="animate-fade-slide-up">
            <RiskAnalyticsPage />
          </div>
        )}
      </main>

      {/* ── Investigation Modal ── */}
      {(selectedAlert || selectedChangeEvent) && (
        <InvestigationModal
          alert={selectedAlert}
          changeEvent={selectedChangeEvent}
          onClose={() => { setSelectedAlert(null); setSelectedChangeEvent(null); }}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onMarkVerification={(id) => { api.updateAlertStatus(id, 'FIELD_VERIFICATION'); }}
        />
      )}

      {/* ── Settings Modal ── */}
      {isSettingsOpen && settings && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings) => { setSettings(newSettings); api.updateSettings(newSettings); }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* ── Police Dispatch Modal ── */}
      {dispatchCell && (
        <PoliceDispatchModal
          cell={dispatchCell}
          stations={dispatchStations}
          forestName={FOREST_NAME}
          onClose={handleCloseDispatch}
          onDispatch={handleDispatchConfirm}
        />
      )}
    </div>
  );
}

export default App;
