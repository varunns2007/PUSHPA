import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import GoogleLiveMap from "../components/Map/GoogleLiveMap";
import { VEHICLES, riskColor, type Vehicle } from "../data/mockData";

export default function VehicleMonitor() {
  const [selected, setSelected] = useState<Vehicle | null>(VEHICLES[0]);
  const [mapMode, setMapMode] = useState<"tactical" | "google">("tactical");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <ModeButton active={mapMode === "tactical"} onClick={() => setMapMode("tactical")}>
            Tactical Map (Esri Satellite)
          </ModeButton>
          <ModeButton active={mapMode === "google"} onClick={() => setMapMode("google")}>
            Live Map (Google)
          </ModeButton>
        </div>
        <div className="font-mono text-[10px] text-ash-400">
          ANAMALAI TIGER RESERVE · COMMERCIAL TIMBER &amp; PATROL TELEMETRY
        </div>
      </div>

      {mapMode === "google" ? (
        <div className="min-h-0 flex-1">
          <GoogleLiveMap />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_340px]">
          <HUDFrame label="VEHICLE MONITOR · GEOFENCE ACTIVE" scanline className="relative overflow-hidden">
            <ForestCanvasMap showVehicles interactive />
            <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] text-ash-300 bg-black/60 px-2 py-1 rounded border border-line/40">
              {VEHICLES.length} REGISTERED VEHICLES · REAL RTO PLATES ACTIVE
            </div>
          </HUDFrame>

          <div className="flex flex-col gap-3 overflow-y-auto">
            <div className="font-mono text-[11px] tracking-wider text-ash-500">TRACKED VEHICLES</div>
            {VEHICLES.map((v, i) => (
              <motion.button
                data-cursor-hover
                key={v.id}
                onClick={() => setSelected(v)}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`flex items-center justify-between border px-3 py-2.5 text-left transition-colors ${
                  selected?.id === v.id ? "border-gold-500/60 bg-panel/60" : "border-line/60 bg-panel/30 hover:border-line"
                }`}
              >
                <div>
                  <div className="font-mono text-xs font-bold text-ash-100">{v.registrationNumber}</div>
                  <div className="font-mono text-[10px] text-ash-400">{v.makeModel}</div>
                  <div className="font-mono text-[9px] text-gold-400/80">{v.rtoLocation}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ color: riskColor(v.risk), border: `1px solid ${riskColor(v.risk)}55` }}>
                    {v.risk}
                  </span>
                  <span className="font-mono text-[8px] text-ash-500">{v.lastSeen}</span>
                </div>
              </motion.button>
            ))}

            <AnimatePresence mode="wait">
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="mt-2 border border-line/70 bg-panel/50 p-4"
                >
                  <div className="flex items-center justify-between border-b border-line/60 pb-2">
                    <span className="font-mono text-sm font-bold text-gold-400">{selected.registrationNumber}</span>
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                      style={{ color: riskColor(selected.risk), backgroundColor: `${riskColor(selected.risk)}20` }}
                    >
                      {selected.risk} RISK
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 font-mono text-[11px] text-ash-300">
                    <Row k="Vehicle" v={selected.makeModel} />
                    <Row k="RTO Region" v={selected.rtoLocation} />
                    <Row k="Location" v={`${selected.lat.toFixed(4)}°N, ${selected.lng.toFixed(4)}°E`} />
                    <Row k="Speed" v={`${selected.speedKmh} km/h`} />
                    <Row k="Route Status" v={selected.routeStatus} />
                    <Row k="Forest Proximity" v={`${selected.forestProximityKm} km`} />
                    <Row k="Cargo / Manifest" v={selected.cargoDescription} />
                    <Row
                      k="Permit Status"
                      v={selected.permitStatus}
                      color={selected.permitStatus === "VALID" ? "var(--color-forest-400)" : "var(--color-earth-500)"}
                    />
                    <Row k="Last Sighting" v={selected.lastSeen} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      data-cursor-hover
      onClick={onClick}
      className={`border px-3 py-1.5 font-mono text-[10px] tracking-wider transition-colors ${
        active ? "border-gold-500/60 bg-panel/60 text-gold-400" : "border-line/60 bg-panel/20 text-ash-500 hover:border-line"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between border-b border-line/50 py-1 text-[10px]">
      <span className="text-ash-500">{k}</span>
      <span className="text-right max-w-[200px] truncate" style={{ color: color ?? "var(--color-ash-100)" }}>{v}</span>
    </div>
  );
}
