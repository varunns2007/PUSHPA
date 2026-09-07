import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';

interface PoliceStation {
  name: string;
  distKm: number;
  lat: number;
  lng: number;
}

interface HeatmapCell {
  col: number;
  row: number;
  densityBefore: number;
  densityToday: number;
  loss: number;
}

interface PoliceDispatchModalProps {
  cell: HeatmapCell | null;
  stations: PoliceStation[];
  forestName: string;
  onClose: () => void;
  onDispatch: (stationName: string) => void;
}

// Forest incident epicentre (Nilgiri)
const INCIDENT_COORD: [number, number] = [11.5855, 76.5520];

// Likely smuggling escape route waypoints (simulated via road logic)
const ESCAPE_ROUTE: [number, number][] = [
  [11.5855, 76.5520],
  [11.5721, 76.5641],
  [11.5600, 76.5800],
  [11.5462, 76.6100],
  [11.5310, 76.6410],
  [11.5100, 76.6700],
];

function FitBoundsToRoute() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([
      [11.40, 76.45],
      [11.62, 76.75],
    ], { padding: [20, 20] });
  }, [map]);
  return null;
}

const severityLabel = (loss: number) => {
  if (loss > 25) return { label: 'CRITICAL', color: '#ef4444' };
  if (loss > 15) return { label: 'HIGH', color: '#f97316' };
  return { label: 'MODERATE', color: '#f59e0b' };
};

export const PoliceDispatchModal: React.FC<PoliceDispatchModalProps> = ({
  cell,
  stations,
  forestName,
  onClose,
  onDispatch,
}) => {
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedTo, setDispatchedTo] = useState<string | null>(null);
  const [alertAll, setAlertAll] = useState(false);
  const [sirenOn, setSirenOn] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Siren visual flash — stops after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setSirenOn(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const sev = severityLabel(cell?.loss ?? 0);
  const timestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Kolkata'
  });

  const handleDispatch = (station: PoliceStation) => {
    setDispatching(true);
    setTimeout(() => {
      setDispatching(false);
      setDispatchedTo(station.name);
      onDispatch(station.name);
    }, 1800);
  };

  const handleAlertAll = () => {
    setAlertAll(true);
    stations.forEach((s, i) => {
      setTimeout(() => onDispatch(s.name), i * 600);
    });
    setTimeout(() => setDispatchedTo('ALL STATIONS'), 1800);
  };

  return (
    <div className="police-dispatch-overlay flex items-center justify-center p-4">
      <div className={`police-dispatch-panel ${sirenOn ? 'animate-siren-flash' : ''}`}>
        {/* ─── HEADER ─── */}
        <div className="relative overflow-hidden rounded-t-xl px-6 py-4 border-b border-red-900/50"
          style={{ background: 'linear-gradient(135deg, rgba(127,0,0,0.5), rgba(40,3,3,0.8))' }}>

          {/* Scanline */}
          <div className="absolute inset-0 hud-scanline pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {/* Siren icon */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center ${
                  sirenOn ? 'animate-glow-red' : ''
                }`}>
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="absolute inset-0 rounded-full border border-red-500/50 animate-beacon-ring" />
              </div>
              <div>
                <div className="font-orbitron text-lg font-black text-red-400 text-glow-red tracking-widest">
                  FOREST LOSS DETECTED
                </div>
                <div className="text-xs text-red-300/80 font-mono-hud mt-0.5">
                  AUTOMATIC POLICE DISPATCH PROTOCOL INITIATED
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block rounded px-3 py-1 text-xs font-black font-orbitron border animate-glow-red"
                style={{ color: sev.color, borderColor: sev.color, background: `${sev.color}15` }}>
                {sev.label}
              </div>
              <div className="text-[10px] text-slate-400 font-mono-hud">{timestamp}</div>
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="p-5 space-y-5">

          {/* Alert metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'FOREST ZONE',    value: forestName.split('(')[0].trim(), color: 'emerald' },
              { label: 'TREE LOSS',      value: `${cell?.loss.toFixed(1) ?? '—'}%`, color: 'red' },
              { label: 'GRID CELL',      value: `C${(cell?.col ?? 0) + 1}·R${(cell?.row ?? 0) + 1}`, color: 'amber' },
              { label: 'DENSITY NOW',    value: `${cell?.densityToday.toFixed(0) ?? '—'}%`, color: 'orange' },
            ].map(m => (
              <div key={m.label} className={`bg-slate-900/80 rounded-lg p-3 border border-${m.color}-900/40`}>
                <div className={`text-[9px] uppercase font-bold tracking-widest text-${m.color}-500 mb-1`}>{m.label}</div>
                <div className={`font-orbitron text-sm font-black text-${m.color}-400`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Escape route map + stations side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Route Map */}
            <div className="lg:col-span-3 rounded-xl overflow-hidden border border-red-900/40" style={{ height: '260px' }}>
              <div className="bg-red-950/40 px-3 py-1.5 border-b border-red-900/30 flex items-center gap-2">
                <span className="text-[9px] font-orbitron uppercase tracking-widest text-red-400">📍 INCIDENT & ROUTE MAP</span>
                <span className="text-[9px] text-slate-500">— Nilgiri Biosphere, Tamil Nadu</span>
              </div>
              <MapContainer
                center={INCIDENT_COORD}
                zoom={11}
                style={{ height: '228px', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <FitBoundsToRoute />

                {/* Incident marker */}
                <CircleMarker center={INCIDENT_COORD} radius={10} color="#ef4444" fillColor="#ef4444" fillOpacity={0.4} weight={2}>
                  <Tooltip permanent direction="top">🌲 LOSS ZONE</Tooltip>
                </CircleMarker>

                {/* Police stations */}
                {stations.map(s => (
                  <CircleMarker key={s.name} center={[s.lat, s.lng]} radius={7} color="#3b82f6" fillColor="#60a5fa" fillOpacity={0.8} weight={2}>
                    <Tooltip direction="top">{s.name}</Tooltip>
                  </CircleMarker>
                ))}

                {/* Route to nearest station */}
                <Polyline
                  positions={[INCIDENT_COORD, [stations[0].lat, stations[0].lng]]}
                  color="#ef4444"
                  weight={2.5}
                  dashArray="6,4"
                />

                {/* Smuggling escape route */}
                <Polyline
                  positions={ESCAPE_ROUTE}
                  color="#f59e0b"
                  weight={2}
                  dashArray="4,6"
                  opacity={0.8}
                />

                {/* Legend on map */}
              </MapContainer>
            </div>

            {/* Nearest police stations */}
            <div className="lg:col-span-2 space-y-2">
              <div className="text-[9px] font-orbitron uppercase tracking-widest text-slate-400 mb-2">
                🚔 NEAREST POLICE CENTRES
              </div>
              {stations.map((s, i) => {
                const eta = Math.ceil(s.distKm / 60 * 60); // minutes at 60 km/h
                const isDispatched = dispatchedTo === s.name || (alertAll && dispatchedTo === 'ALL STATIONS');
                return (
                  <div key={s.name}
                    className={`rounded-xl p-3 border transition-all duration-300 ${
                      isDispatched
                        ? 'bg-emerald-950/60 border-emerald-600/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-blue-700/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-200">{s.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono-hud mt-0.5">
                          {s.lat.toFixed(4)}°N, {s.lng.toFixed(4)}°E
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-black text-blue-400 font-orbitron">{s.distKm} km</div>
                        <div className="text-[9px] text-slate-500">ETA ~{eta} min</div>
                      </div>
                    </div>

                    {isDispatched ? (
                      <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
                        <span>✅</span>
                        <span>UNIT DISPATCHED — RESPONDING</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDispatch(s)}
                        disabled={dispatching || !!dispatchedTo}
                        className="w-full btn-dispatch text-[9px] py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {dispatching ? (
                          <><span className="animate-dispatch-spin inline-block">⟳</span> DISPATCHING…</>
                        ) : (
                          <>🚔 DISPATCH UNIT #{i + 1}</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Escape route note */}
              <div className="rounded-lg bg-amber-950/30 border border-amber-900/40 p-2.5 text-[9px] text-amber-400 space-y-0.5">
                <div className="font-bold">🟡 SUSPECTED ESCAPE ROUTE</div>
                <div className="text-slate-400">NH-67 → Gudalur → Kozhikode · ~62 km exit</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-red-900/30">
            <button
              onClick={handleAlertAll}
              disabled={!!dispatchedTo}
              className="btn-alert-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              📡 ALERT ALL STATIONS
            </button>

            {dispatchedTo && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold animate-fade-slide-up">
                <span className="animate-glow-green w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                DISPATCH CONFIRMED — {dispatchedTo}
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onClose}
                className="btn-ghost flex items-center gap-1.5"
              >
                ✕ MARK FALSE ALARM
              </button>
              <button onClick={onClose} className="btn-ghost flex items-center gap-1.5">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
