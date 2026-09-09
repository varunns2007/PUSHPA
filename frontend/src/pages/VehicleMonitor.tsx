import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import { VEHICLES, riskColor, type Vehicle } from "../data/mockData";

export default function VehicleMonitor() {
  const [selected, setSelected] = useState<Vehicle | null>(VEHICLES[0]);

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
      <HUDFrame label="VEHICLE MONITOR · GEOFENCE ACTIVE" scanline className="relative overflow-hidden">
        <ForestCanvasMap showVehicles interactive />
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] text-ash-500">
          {VEHICLES.length} TRACKED VEHICLES · DEMO DATA
        </div>
      </HUDFrame>

      <div className="flex flex-col gap-3">
        <div className="font-mono text-[11px] tracking-wider text-ash-500">VEHICLE LIST</div>
        {VEHICLES.map((v, i) => (
          <motion.button
            data-cursor-hover
            key={v.id}
            onClick={() => setSelected(v)}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`flex items-center justify-between border px-3 py-2 text-left transition-colors ${
              selected?.id === v.id ? "border-gold-500/60 bg-panel/60" : "border-line/60 bg-panel/30 hover:border-line"
            }`}
          >
            <div>
              <div className="font-mono text-xs text-ash-100">#{v.id}</div>
              <div className="font-mono text-[10px] text-ash-500">{v.type}</div>
            </div>
            <span className="rounded-sm px-1.5 py-0.5 font-mono text-[9px]" style={{ color: riskColor(v.risk), border: `1px solid ${riskColor(v.risk)}55` }}>
              {v.risk}
            </span>
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
              className="mt-2 border border-line/70 bg-panel/40 p-4"
            >
              <div className="font-mono text-sm text-gold-400">VEHICLE #{selected.id}</div>
              <div className="mt-3 space-y-1.5 font-mono text-[11px] text-ash-300">
                <Row k="Location" v={`${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`} />
                <Row k="Route Status" v={selected.routeStatus} />
                <Row k="Forest Proximity" v={`${selected.forestProximityKm} km`} />
                <Row k="Risk" v={selected.risk} color={riskColor(selected.risk)} />
                <Row k="Last Seen" v={selected.lastSeen} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between border-b border-line/50 py-1">
      <span className="text-ash-500">{k}</span>
      <span style={{ color: color ?? "var(--color-ash-100)" }}>{v}</span>
    </div>
  );
}
