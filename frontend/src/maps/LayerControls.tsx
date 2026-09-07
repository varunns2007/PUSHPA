import React from 'react';
import { Layers, Globe } from 'lucide-react';

export interface LayerToggles {
  forestBoundaries: boolean;
  basemapMode: 'google-hybrid' | 'google-roads' | 'carto-dark';
  denseTreeHeatmap: boolean;      // 🟢 Dense Tree Coverage Heatmap
  treesCutHeatmap: boolean;       // 🔴 Trees Cut / Deforestation Heatmap
  ndviOverlay: boolean;
  vegDensity: boolean;
  changePolygons: boolean;
  historicalIncidents: boolean;
  roads: boolean;
  vehicles: boolean;
  vehicleRoutes: boolean;
  highRiskZones: boolean;
  permittedLocations: boolean;
}

interface LayerControlsProps {
  layers: LayerToggles;
  onToggle: (layerKey: keyof LayerToggles) => void;
  onSelectBasemap: (mode: 'google-hybrid' | 'google-roads' | 'carto-dark') => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ layers, onToggle, onSelectBasemap }) => {
  const items: { key: keyof LayerToggles; label: string; color: string; badge?: string }[] = [
    { key: 'denseTreeHeatmap', label: 'Dense Tree Canopy Heatmap', color: 'emerald', badge: '🟢 GREEN' },
    { key: 'treesCutHeatmap', label: 'Trees Cut / Deforestation Heatmap', color: 'red', badge: '🔴 RED' },
    { key: 'forestBoundaries', label: 'Forest Boundaries', color: 'emerald' },
    { key: 'ndviOverlay', label: 'NDVI Spectral Surface', color: 'teal' },
    { key: 'changePolygons', label: 'Extracted Loss Polygons', color: 'rose' },
    { key: 'historicalIncidents', label: 'Historical Incidents', color: 'amber' },
    { key: 'roads', label: 'Forest Road Corridors', color: 'blue' },
    { key: 'vehicles', label: 'Tracked Timber Vehicles', color: 'cyan' },
    { key: 'vehicleRoutes', label: 'Vehicle Trajectories', color: 'indigo' },
    { key: 'permittedLocations', label: 'Permitted Timber Depots', color: 'purple' },
  ];

  return (
    <div className="gis-glass rounded-xl p-3.5 border border-slate-800 space-y-3">
      {/* Basemap Selector */}
      <div className="space-y-1.5 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-slate-300">
          <Globe className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider">MAP BASEMAP ENGINE</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onSelectBasemap('google-hybrid')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-extrabold transition-all border ${
              layers.basemapMode === 'google-hybrid'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🗺️ Google Satellite
          </button>

          <button
            onClick={() => onSelectBasemap('google-roads')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-extrabold transition-all border ${
              layers.basemapMode === 'google-roads'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🛣️ Google Roads
          </button>

          <button
            onClick={() => onSelectBasemap('carto-dark')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-extrabold transition-all border ${
              layers.basemapMode === 'carto-dark'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🌙 Dark GIS
          </button>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <Layers className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">GIS HEATMAP & FEATURE LAYERS</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.map((item) => (
          <label
            key={item.key}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border cursor-pointer transition-all ${
              layers[item.key as keyof LayerToggles]
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-slate-950/60 border-slate-900 text-slate-500 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              <input
                type="checkbox"
                checked={Boolean(layers[item.key as keyof LayerToggles])}
                onChange={() => onToggle(item.key as keyof LayerToggles)}
                className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
              />
              <span className="font-semibold truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] font-black tracking-wider flex-shrink-0 ml-1">
                {item.badge}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};
