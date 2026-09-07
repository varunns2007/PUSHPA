import React from 'react';
import { Layers, Globe, Eye, EyeOff } from 'lucide-react';

export interface LayerToggles {
  forestBoundaries: boolean;
  basemapMode: 'google-hybrid' | 'google-roads' | 'carto-dark';
  denseTreeHeatmap: boolean;
  treesCutHeatmap: boolean;
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

// Dot color for each layer (realistic legend color)
const LAYER_DOT: Record<string, string> = {
  denseTreeHeatmap:    '#22c55e',
  treesCutHeatmap:     '#ef4444',
  forestBoundaries:    '#EA580C',
  ndviOverlay:         '#a855f7',
  changePolygons:      '#f43f5e',
  historicalIncidents: '#F59E0B',
  roads:               '#60a5fa',
  vehicles:            '#fb923c',
  vehicleRoutes:       '#818cf8',
  permittedLocations:  '#34d399',
};

const LAYER_ITEMS: { key: keyof LayerToggles; label: string; sublabel: string }[] = [
  { key: 'denseTreeHeatmap',    label: 'Dense Canopy Heatmap',  sublabel: 'Tree cover density' },
  { key: 'treesCutHeatmap',     label: 'Deforestation Hotspots', sublabel: 'Loss zones · red heat' },
  { key: 'forestBoundaries',    label: 'Forest Boundaries',      sublabel: 'Reserve perimeter' },
  { key: 'ndviOverlay',         label: 'NDVI Spectral Layer',    sublabel: 'Vegetation index' },
  { key: 'changePolygons',      label: 'Loss Polygons',          sublabel: 'Detected clearings' },
  { key: 'historicalIncidents', label: 'Incident History',       sublabel: 'Past logging events' },
  { key: 'roads',               label: 'Road Corridors',         sublabel: 'Timber transport routes' },
  { key: 'vehicles',            label: 'Timber Vehicles',        sublabel: 'Live GPS positions' },
  { key: 'vehicleRoutes',       label: 'Vehicle Trajectories',   sublabel: 'Route paths' },
  { key: 'permittedLocations',  label: 'Licensed Depots',        sublabel: 'Approved timber yards' },
];

const BASEMAPS: { id: 'google-hybrid' | 'google-roads' | 'carto-dark'; icon: string; label: string; sub: string }[] = [
  { id: 'google-hybrid', icon: '🛰️', label: 'Satellite',  sub: 'Google Hybrid' },
  { id: 'google-roads',  icon: '🛣️', label: 'Roads',      sub: 'Google Maps' },
  { id: 'carto-dark',    icon: '🌑', label: 'Dark GIS',   sub: 'Carto Dark' },
];

export const LayerControls: React.FC<LayerControlsProps> = ({ layers, onToggle, onSelectBasemap }) => {
  const activeCount = LAYER_ITEMS.filter(l => layers[l.key]).length;

  return (
    <div
      className="rounded-xl flex flex-col animate-fade-slide-up"
      style={{
        background: 'rgba(21,5,0,0.93)',
        border: '1px solid rgba(185,28,28,0.22)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: '1px solid rgba(185,28,28,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" style={{ color: '#EA580C' }} />
          <span className="font-orbitron text-[10px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
            GIS Layers
          </span>
        </div>
        <span
          className="font-mono-hud text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(185,28,28,0.2)', color: '#EA580C', border: '1px solid rgba(185,28,28,0.35)' }}
        >
          {activeCount}/{LAYER_ITEMS.length} ON
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* ── Basemap Selector ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" style={{ color: 'rgba(217,119,6,0.7)' }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Basemap Engine
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {BASEMAPS.map(bm => {
              const active = layers.basemapMode === bm.id;
              return (
                <button
                  key={bm.id}
                  onClick={() => onSelectBasemap(bm.id)}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 px-1 transition-all duration-200"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(127,29,29,0.7), rgba(185,28,28,0.4))',
                    border: '1px solid rgba(185,28,28,0.6)',
                    boxShadow: '0 0 10px rgba(185,28,28,0.25)',
                  } : {
                    background: 'rgba(10,3,0,0.7)',
                    border: '1px solid rgba(185,28,28,0.12)',
                  }}
                >
                  <span className="text-base leading-none">{bm.icon}</span>
                  <span
                    className="text-[9px] font-bold leading-tight text-center"
                    style={{ color: active ? '#FCA5A5' : 'rgba(217,119,6,0.55)' }}
                  >
                    {bm.label}
                  </span>
                  <span
                    className="text-[8px] leading-none"
                    style={{ color: active ? 'rgba(252,165,165,0.6)' : 'rgba(217,119,6,0.3)' }}
                  >
                    {bm.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'rgba(185,28,28,0.12)' }} />

        {/* ── Layer Toggles ── */}
        <div className="space-y-1">
          {LAYER_ITEMS.map((item) => {
            const on = Boolean(layers[item.key]);
            const dot = LAYER_DOT[item.key] ?? '#EA580C';

            return (
              <button
                key={item.key}
                onClick={() => onToggle(item.key)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150 group text-left"
                style={on ? {
                  background: 'rgba(185,28,28,0.1)',
                  border: '1px solid rgba(185,28,28,0.22)',
                } : {
                  background: 'rgba(10,3,0,0.5)',
                  border: '1px solid rgba(185,28,28,0.07)',
                }}
              >
                {/* Colored indicator dot */}
                <span
                  className="flex-shrink-0 rounded-full transition-all duration-200"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: on ? dot : 'rgba(100,50,50,0.4)',
                    boxShadow: on ? `0 0 6px ${dot}90` : 'none',
                  }}
                />

                {/* Label + sublabel */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[10px] font-semibold truncate leading-tight"
                    style={{ color: on ? '#F5E6DC' : 'rgba(245,230,220,0.35)' }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="text-[8px] leading-tight truncate"
                    style={{ color: on ? 'rgba(217,119,6,0.5)' : 'rgba(217,119,6,0.2)' }}
                  >
                    {item.sublabel}
                  </div>
                </div>

                {/* Eye icon */}
                <span className="flex-shrink-0 transition-all duration-200" style={{ opacity: on ? 0.7 : 0.25 }}>
                  {on
                    ? <Eye className="h-3 w-3" style={{ color: dot }} />
                    : <EyeOff className="h-3 w-3" style={{ color: 'rgba(185,28,28,0.4)' }} />
                  }
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
