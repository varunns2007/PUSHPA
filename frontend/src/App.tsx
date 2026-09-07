import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DemoScenarioBar } from './components/DemoScenarioBar';
import { StatsOverview } from './components/StatsOverview';
import { AlertsList } from './components/AlertsList';
import { InvestigationModal } from './components/InvestigationModal';
import { SettingsModal } from './components/SettingsModal';

import { MainGISMap } from './maps/MainGISMap';
import { LayerControls } from './maps/LayerControls';
import type { LayerToggles } from './maps/LayerControls';
import { SplitComparisonMap } from './maps/SplitComparisonMap';
import { TerrainForestScene } from './three/TerrainForestScene';

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

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Data State
  const [forests, setForests] = useState<ForestArea[]>([]);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [changePolygons, setChangePolygons] = useState<ChangePolygon[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [permits, setPermits] = useState<TimberPermit[]>([]);
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Map & Modal State
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedChangeEvent, setSelectedChangeEvent] = useState<ChangeEvent | null>(null);
  const [selectedForest, setSelectedForest] = useState<ForestArea | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Demo Scenario State
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);

  // GIS Layer Toggles (Google Maps Basemap & Dual Heatmaps Default ON)
  const [layers, setLayers] = useState<LayerToggles>({
    forestBoundaries: true,
    basemapMode: 'google-hybrid',
    denseTreeHeatmap: true,      // 🟢 Dense Tree Coverage Heatmap (Green)
    treesCutHeatmap: true,       // 🔴 Trees Cut Deforestation Heatmap (Red)
    ndviOverlay: false,
    vegDensity: true,
    changePolygons: true,
    historicalIncidents: true,
    roads: true,
    vehicles: true,
    vehicleRoutes: true,
    highRiskZones: true,
    permittedLocations: true,
  });

  // Fetch initial data
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

      // Collect change polygons
      const polys = cData.flatMap(c => c.polygons);
      setChangePolygons(polys);
    } catch (e) {
      console.error("Error loading PUSHPA data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle Layer
  const handleToggleLayer = (key: keyof LayerToggles) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Switch Map Basemap Engine
  const handleSelectBasemap = (mode: 'google-hybrid' | 'google-roads' | 'carto-dark') => {
    setLayers(prev => ({ ...prev, basemapMode: mode }));
  };

  // Trigger Demo Scenario
  const handleStartDemo = () => {
    setIsDemoRunning(true);
    setDemoStep(1);
    setActiveTab('dashboard');
  };

  const demoStepsList = [
    "Querying Copernicus Sentinel-2 Satellite Observation for Nilgiri Biosphere Zone A",
    "Calculating Vegetation Density Index (NDVI B08 & B04 matrices)",
    "Before vs After NDVI comparison detected 59.2% vegetation drop",
    "Extracted Change Polygon CHG_POLY_001 (2.73 ha clearing)",
    "Tracked Vehicle TN01AB1234 detected traversing within 2.3 km",
    "Route Analysis: Vehicle route intersects forest change zone heading to unregistered destination",
    "Timber Permit Verification: NO VALID PERMIT FOUND for vehicle TN01AB1234",
    "Historical Incident Correlation: Area matches 8 prior illegal logging incidents",
    "Explainable AI Risk Engine calculated Investigation Risk Score: 91/100 (CRITICAL)",
    "🚨 CRITICAL ALERT TRIGGERED: Opening Officer Investigation Panel"
  ];

  const handleNextDemoStep = () => {
    if (demoStep < 10) {
      setDemoStep(prev => prev + 1);
    } else {
      // Step 10: Trigger alert & open investigation panel
      setFlyToCenter([11.5855, 76.5520]);
      if (alerts.length > 0) {
        setSelectedAlert(alerts[0]);
      }
    }
  };

  const handleSimulateVehicleStep = async () => {
    try {
      const updated = await api.simulateVehicles();
      setVehicles(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const unpermittedCount = vehicles.filter(v => v.permit_status !== 'VALID').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const avgRisk = 78;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemo={handleStartDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        liveStatus={true}
      />

      {/* Demo Scenario Controller Bar */}
      {isDemoRunning && (
        <DemoScenarioBar
          currentStep={demoStep}
          totalSteps={10}
          stepName={demoStepsList[demoStep - 1]}
          onNext={handleNextDemoStep}
          onClose={() => setIsDemoRunning(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 max-w-[1800px] w-full mx-auto">
        {/* Top Stats Overview */}
        <StatsOverview
          forestsCount={forests.length}
          changesCount={changes.length}
          criticalAlertsCount={criticalCount}
          vehiclesCount={vehicles.length}
          unpermittedCount={unpermittedCount}
          avgRisk={avgRisk}
        />

        {/* Tab 1: Main Command Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[580px]">
            {/* GIS Map Canvas (3 Cols) */}
            <div className="lg:col-span-3 h-[580px] relative">
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
                onSelectVehicle={() => {
                  setActiveTab('vehicles');
                }}
                flyToCenter={flyToCenter}
              />
            </div>

            {/* Right Panel: Layer Controls & Alerts */}
            <div className="lg:col-span-1 space-y-4 flex flex-col h-[580px]">
              <LayerControls
                layers={layers}
                onToggle={handleToggleLayer}
                onSelectBasemap={handleSelectBasemap}
              />
              <div className="flex-1 overflow-hidden">
                <AlertsList
                  alerts={alerts}
                  onSelectAlert={(alt) => {
                    setSelectedAlert(alt);
                    setFlyToCenter([alt.location_lat, alt.location_lng]);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Forest Monitoring */}
        {activeTab === 'forests' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[580px]">
            <div className="lg:col-span-3 h-full">
              <MainGISMap
                forests={forests}
                changePolygons={changePolygons}
                vehicles={vehicles}
                incidents={incidents}
                layers={layers}
                selectedForest={selectedForest}
                onSelectPolygon={() => {}}
                onSelectVehicle={() => {}}
              />
            </div>
            <div className="lg:col-span-1 gis-glass p-4 rounded-xl border border-slate-800 space-y-3 overflow-y-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">FOREST REGIONS ({forests.length})</h3>
              <div className="space-y-2">
                {forests.map(f => (
                  <div key={f.id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-100">
                      <span>{f.name}</span>
                      <span className="text-emerald-400">{f.code}</span>
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

        {/* Tab 3: Satellite Analysis */}
        {activeTab === 'satellite' && (
          <SatelliteAnalysisPage forests={forests} onSelectForest={setSelectedForest} />
        )}

        {/* Tab 4: Change Detection & Comparison */}
        {activeTab === 'changes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
            <SplitComparisonMap forestName="Nilgiri Biosphere Reserve (Zone A)" />
            <ChangeDetectionPage
              forests={forests}
              changes={changes}
              onSelectPolygon={() => {
                if (alerts.length > 0) setSelectedAlert(alerts[0]);
              }}
            />
          </div>
        )}

        {/* Tab 5: 3D Forest View */}
        {activeTab === '3d-forest' && (
          <div className="h-[600px]">
            <TerrainForestScene forestName="Nilgiri Biosphere Reserve (Zone A)" />
          </div>
        )}

        {/* Tab 6: Vehicle Intelligence */}
        {activeTab === 'vehicles' && (
          <VehicleIntelligencePage
            vehicles={vehicles}
            permits={permits}
            onSimulateStep={handleSimulateVehicleStep}
            onSelectVehicle={(v) => {
              setFlyToCenter([v.current_lat, v.current_lng]);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* Tab 7: Routes */}
        {activeTab === 'routes' && (
          <VehicleIntelligencePage
            vehicles={vehicles}
            permits={permits}
            onSimulateStep={handleSimulateVehicleStep}
            onSelectVehicle={() => {}}
          />
        )}

        {/* Tab 8: Timber Permits */}
        {activeTab === 'permits' && <TimberPermitsPage permits={permits} />}

        {/* Tab 9: Historical Incidents */}
        {activeTab === 'incidents' && <HistoricalIncidentsPage incidents={incidents} />}

        {/* Tab 10: Risk Engine */}
        {activeTab === 'risk' && <RiskAnalyticsPage />}
      </main>

      {/* Officer Case Investigation Modal */}
      {(selectedAlert || selectedChangeEvent) && (
        <InvestigationModal
          alert={selectedAlert}
          changeEvent={selectedChangeEvent}
          onClose={() => { setSelectedAlert(null); setSelectedChangeEvent(null); }}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onMarkVerification={(id) => {
            api.updateAlertStatus(id, 'FIELD_VERIFICATION');
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && settings && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings) => {
            setSettings(newSettings);
            api.updateSettings(newSettings);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
