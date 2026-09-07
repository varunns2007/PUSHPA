import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CinematicIntro } from './components/CinematicIntro';
import { DemoScenarioBar } from './components/DemoScenarioBar';
import { StatsOverview } from './components/StatsOverview';
import { AlertsList } from './components/AlertsList';
import { InvestigationModal } from './components/InvestigationModal';
import { SettingsModal } from './components/SettingsModal';

import { MainGISMap } from './maps/MainGISMap';
import { LayerControls } from './maps/LayerControls';
import type { LayerToggles, BasemapMode } from './maps/LayerControls';
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

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return !sessionStorage.getItem('pushpa_intro_seen');
  });

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

  // GIS Layer Toggles
  const [layers, setLayers] = useState<LayerToggles>({
    forestBoundaries: true,
    basemapMode: 'satellite',
    ndviOverlay: false,
    ndviChange: false,
    disturbancePolygons: true,
    vehicles: true,
    vehicleRoutes: true,
    permittedLocations: true,
    historicalHotspots: true,
  });

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

      const polys = cData.flatMap(c => c.polygons);
      setChangePolygons(polys);
    } catch (e) {
      console.error("Error loading PUSHPA intelligence data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('pushpa_intro_seen', 'true');
    setShowIntro(false);
  };

  const handleToggleLayer = (layerKey: keyof LayerToggles) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectBasemap = (mode: BasemapMode) => {
    setLayers(prev => ({ ...prev, basemapMode: mode }));
  };

  const handleSelectPolygon = (poly: ChangePolygon) => {
    const parentEvent = changes.find(c => c.id === poly.event_id) || changes[0] || null;
    setSelectedChangeEvent(parentEvent);
    setFlyToCenter([poly.centroid_lat, poly.centroid_lng]);
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setFlyToCenter([v.current_lat, v.current_lng]);
  };

  const handleMarkVerification = async (alertId: string) => {
    try {
      await api.updateAlertStatus(alertId, 'FIELD_VERIFICATION');
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, investigation_status: 'FIELD_VERIFICATION' } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateVehicleStep = () => {
    // Incrementally step simulated vehicle positions along tracks
    setVehicles(prev => prev.map(v => ({
      ...v,
      current_lat: v.current_lat + (Math.random() - 0.5) * 0.002,
      current_lng: v.current_lng + (Math.random() - 0.5) * 0.002,
      speed_kmh: Math.max(10, Math.min(80, v.speed_kmh + (Math.random() - 0.5) * 5))
    })));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0907] text-[#F1E7D5] selection:bg-[#8E2B18] selection:text-[#F1E7D5]">
      {/* 1. Cinematic Intro Overlay */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* 2. Top Tactical Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemo={() => setIsDemoRunning(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        liveStatus={true}
      />

      {/* 3. Demo Scenario Bar */}
      {isDemoRunning && (
        <DemoScenarioBar
          currentStep={demoStep}
          totalSteps={5}
          stepName={`Phase ${demoStep}: Correlated Disturbance Inspection`}
          onNext={() => setDemoStep(s => (s >= 5 ? 1 : s + 1))}
          onClose={() => setIsDemoRunning(false)}
        />
      )}

      {/* 4. Main Tactical Content Area */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Top Stat Overview Tiles */}
            <StatsOverview
              forests={forests}
              changePolygons={changePolygons}
              vehicles={vehicles}
              alerts={alerts}
            />

            {/* Tactical Grid: Left 2D GIS Map & Controls, Right Live Alert Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[640px]">
              <div className="lg:col-span-2 flex flex-col space-y-3 h-full">
                {/* 2D GIS Map */}
                <div className="flex-1 min-h-[440px]">
                  <MainGISMap
                    forests={forests}
                    changePolygons={changePolygons}
                    vehicles={vehicles}
                    incidents={incidents}
                    layers={layers}
                    selectedForest={selectedForest}
                    onSelectPolygon={handleSelectPolygon}
                    onSelectVehicle={handleSelectVehicle}
                    flyToCenter={flyToCenter}
                  />
                </div>

                {/* Layer Toggles Panel */}
                <LayerControls
                  layers={layers}
                  onToggle={handleToggleLayer}
                  onSelectBasemap={handleSelectBasemap}
                />
              </div>

              {/* Right Alert Operations Console */}
              <div className="h-full">
                <AlertsList
                  alerts={alerts}
                  onSelectAlert={(a) => setSelectedAlert(a)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'satellite' && (
          <SatelliteAnalysisPage
            forests={forests}
            onSelectForest={(f) => {
              setSelectedForest(f);
              setFlyToCenter([f.center_lat, f.center_lng]);
            }}
          />
        )}

        {activeTab === 'changes' && (
          <ChangeDetectionPage
            forests={forests}
            changes={changes}
            onSelectPolygon={handleSelectPolygon}
          />
        )}

        {activeTab === '3d-forest' && (
          <div className="h-[750px] w-full">
            <TerrainForestScene forestName="Nilgiri Biosphere Reserve (Zone A)" />
          </div>
        )}

        {activeTab === 'vehicles' && (
          <VehicleIntelligencePage
            vehicles={vehicles}
            permits={permits}
            onSimulateStep={handleSimulateVehicleStep}
            onSelectVehicle={handleSelectVehicle}
          />
        )}

        {activeTab === 'permits' && <TimberPermitsPage permits={permits} />}
        {activeTab === 'incidents' && <HistoricalIncidentsPage incidents={incidents} />}
        {activeTab === 'risk' && <RiskAnalyticsPage />}
      </main>

      {/* 5. Investigation Modal */}
      {(selectedAlert || selectedChangeEvent) && (
        <InvestigationModal
          alert={selectedAlert}
          changeEvent={selectedChangeEvent}
          onClose={() => {
            setSelectedAlert(null);
            setSelectedChangeEvent(null);
          }}
          onNavigateTab={(t) => setActiveTab(t)}
          onMarkVerification={handleMarkVerification}
        />
      )}

      {/* 6. Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings || {
            google_maps_api_key: '',
            copernicus_client_id: '',
            copernicus_client_secret: '',
            simulation_mode: true,
            simulation_speed_sec: 3,
            ndvi_non_veg_threshold: 0.2,
            ndvi_sparse_threshold: 0.4,
            ndvi_moderate_threshold: 0.6,
            risk_low_max: 29,
            risk_moderate_max: 49,
            risk_high_max: 69,
            risk_very_high_max: 84
          }}
          onClose={() => setIsSettingsOpen(false)}
          onSave={async (newSettings) => {
            setSettings(newSettings);
            setIsSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
