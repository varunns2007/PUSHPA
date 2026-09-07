import React from 'react';
import { Layers, Globe } from 'lucide-react';

export type BasemapMode = 'satellite' | 'dark' | 'topo';

export interface LayerToggles {
  basemapMode: BasemapMode;
  forestBoundaries: boolean;
  ndviOverlay: boolean;
  ndviChange: boolean;
  disturbancePolygons: boolean;
  vehicles: boolean;
  vehicleRoutes: boolean;
  permittedLocations: boolean;
  historicalHotspots: boolean;
}

interface LayerControlsProps {
  layers: LayerToggles;
  onToggle: (layerKey: keyof LayerToggles) => void;
  onSelectBasemap: (mode: BasemapMode) => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onToggle,
  onSelectBasemap,
}) => {
  return (
    <div className="pushpa-panel rounded-xl p-3.5 border border-[#4A3022]/60 space-y-3">
      {/* 1. Basemap Selector */}
      <div className="space-y-1.5 border-b border-[#4A3022]/40 pb-2.5">
        <div className="flex items-center justify-between text-xs font-tactical font-bold text-[#A99A87] uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <Globe className="h-3.5 w-3.5 text-[#D99A4A]" />
            <span>BASEMAP PROVIDER</span>
          </div>
          <span className="text-[10px] text-[#74695D] font-mono">WGS84 / EPSG:4326</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onSelectBasemap('satellite')}
            className={`rounded-lg py-1 px-2 text-[11px] font-tactical font-bold uppercase transition-all border ${
              layers.basemapMode === 'satellite'
                ? 'bg-[#8E2B18] text-[#F1E7D5] border-[#D99A4A] shadow-sm'
                : 'bg-[#12100D] text-[#A99A87] border-[#4A3022] hover:bg-[#1D1813]'
            }`}
          >
            Satellite
          </button>

          <button
            onClick={() => onSelectBasemap('dark')}
            className={`rounded-lg py-1 px-2 text-[11px] font-tactical font-bold uppercase transition-all border ${
              layers.basemapMode === 'dark'
                ? 'bg-[#4A3022] text-[#F1E7D5] border-[#D99A4A] shadow-sm'
                : 'bg-[#12100D] text-[#A99A87] border-[#4A3022] hover:bg-[#1D1813]'
            }`}
          >
            Dark GIS
          </button>

          <button
            onClick={() => onSelectBasemap('topo')}
            className={`rounded-lg py-1 px-2 text-[11px] font-tactical font-bold uppercase transition-all border ${
              layers.basemapMode === 'topo'
                ? 'bg-[#2B1C14] text-[#F1E7D5] border-[#D99A4A] shadow-sm'
                : 'bg-[#12100D] text-[#A99A87] border-[#4A3022] hover:bg-[#1D1813]'
            }`}
          >
            Terrain Topo
          </button>
        </div>
      </div>

      {/* 2. Operational GIS Layers */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-tactical font-bold uppercase tracking-wider text-[#F1E7D5]">
          <Layers className="h-3.5 w-3.5 text-[#D99A4A]" />
          <span>TACTICAL INTELLIGENCE LAYERS</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {/* Reserve Boundaries */}
          <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
            layers.forestBoundaries ? 'bg-[#1D1813] border-[#718C48] text-[#F1E7D5]' : 'bg-[#12100D] border-[#4A3022]/30 text-[#74695D]'
          }`}>
            <span className="font-tactical font-semibold flex items-center space-x-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#718C48]" />
              <span className="truncate">Reserve Forest AOI</span>
            </span>
            <input
              type="checkbox"
              checked={layers.forestBoundaries}
              onChange={() => onToggle('forestBoundaries')}
              className="accent-[#718C48]"
            />
          </label>

          {/* Disturbance Polygons */}
          <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
            layers.disturbancePolygons ? 'bg-[#1D1813] border-[#D52B1E] text-[#F1E7D5]' : 'bg-[#12100D] border-[#4A3022]/30 text-[#74695D]'
          }`}>
            <span className="font-tactical font-semibold flex items-center space-x-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#D52B1E]" />
              <span className="truncate">Loss Polygons</span>
            </span>
            <input
              type="checkbox"
              checked={layers.disturbancePolygons}
              onChange={() => onToggle('disturbancePolygons')}
              className="accent-[#D52B1E]"
            />
          </label>

          {/* Tracked Vehicles */}
          <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
            layers.vehicles ? 'bg-[#1D1813] border-[#D99A4A] text-[#F1E7D5]' : 'bg-[#12100D] border-[#4A3022]/30 text-[#74695D]'
          }`}>
            <span className="font-tactical font-semibold flex items-center space-x-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#D99A4A]" />
              <span className="truncate">Active Timber Vehicles</span>
            </span>
            <input
              type="checkbox"
              checked={layers.vehicles}
              onChange={() => onToggle('vehicles')}
              className="accent-[#D99A4A]"
            />
          </label>

          {/* Vehicle Routes */}
          <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
            layers.vehicleRoutes ? 'bg-[#1D1813] border-[#B65324] text-[#F1E7D5]' : 'bg-[#12100D] border-[#4A3022]/30 text-[#74695D]'
          }`}>
            <span className="font-tactical font-semibold flex items-center space-x-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#B65324]" />
              <span className="truncate">Vehicle GPS Corridors</span>
            </span>
            <input
              type="checkbox"
              checked={layers.vehicleRoutes}
              onChange={() => onToggle('vehicleRoutes')}
              className="accent-[#B65324]"
            />
          </label>

          {/* Historical Incidents */}
          <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
            layers.historicalHotspots ? 'bg-[#1D1813] border-[#8E2B18] text-[#F1E7D5]' : 'bg-[#12100D] border-[#4A3022]/30 text-[#74695D]'
          }`}>
            <span className="font-tactical font-semibold flex items-center space-x-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#8E2B18]" />
              <span className="truncate">Historical Hotspots</span>
            </span>
            <input
              type="checkbox"
              checked={layers.historicalHotspots}
              onChange={() => onToggle('historicalHotspots')}
              className="accent-[#8E2B18]"
            />
          </label>

          {/* Permitted Timber Depots */}
          <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
            layers.permittedLocations ? 'bg-[#1D1813] border-[#9A8065] text-[#F1E7D5]' : 'bg-[#12100D] border-[#4A3022]/30 text-[#74695D]'
          }`}>
            <span className="font-tactical font-semibold flex items-center space-x-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#9A8065]" />
              <span className="truncate">Permitted Depots</span>
            </span>
            <input
              type="checkbox"
              checked={layers.permittedLocations}
              onChange={() => onToggle('permittedLocations')}
              className="accent-[#9A8065]"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
