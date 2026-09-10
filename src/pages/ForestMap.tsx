import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import { type Hotspot, riskColor } from "../data/mockData";

export default function ForestMap() {
  const [selected, setSelected] = useState<Hotspot | null>(null);

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden p-4"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative h-full w-full border border-line/70">
        <ForestCanvasMap onSelectHotspot={setSelected} selectedId={selected?.id ?? null} />

        {/* HUD overlays */}
        <div className="pointer-events-none absolute left-4 top-4 font-mono text-[11px] text-ash-300">
          <div className="text-gold-400 tracking-[0.15em]">FOREST REGION</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-forest-400">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-forest-400" /> MONITORING ACTIVE
          </div>
        </div>
        <div className="pointer-events-none absolute right-4 top-4 text-right font-mono text-[11px] text-ash-300">
          <div className="text-gold-400 tracking-[0.15em]">LIVE ANALYSIS</div>
          <div className="mt-0.5 flex items-center justify-end gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-forest-400" /> ONLINE
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 flex gap-6 font-mono text-[11px]">
          <Stat label="DENSITY" value="82.4%" color="var(--color-forest-400)" />
          <Stat label="CHANGE" value="-4.8%" color="var(--color-earth-400)" />
          <Stat label="RISK" value="HIGH" color="var(--color-earth-500)" />
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 font-mono text-[10px] text-ash-500">
          SCROLL TO ZOOM · DRAG TO PAN
        </div>

        {/* corner brackets */}
        {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map((c) => (
          <div key={c} className={`pointer-events-none absolute h-4 w-4 border-gold-500/50 ${c}`} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute right-8 top-8 z-10 w-72 border border-line bg-void/90 p-4 backdrop-blur-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-xs text-gold-400">{selected.id}</div>
                <div className="text-sm text-ash-100">{selected.label}</div>
              </div>
              <button data-cursor-hover onClick={() => setSelected(null)} className="text-ash-500 hover:text-ash-100">✕</button>
            </div>
            <div className="mt-3 space-y-1.5 font-mono text-[11px] text-ash-300">
              <Row k="Density" v={`${selected.densityBefore}% → ${selected.densityAfter}%`} />
              <Row k="Change" v={`${selected.changePct}%`} />
              <Row k="Area" v={`${selected.areaKm2} km²`} />
              <Row k="Confidence" v={`${selected.confidence}%`} />
              <Row k="Risk" v={selected.risk} color={riskColor(selected.risk)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-ash-500">{label}</div>
      <div className="text-sm" style={{ color }}>{value}</div>
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
