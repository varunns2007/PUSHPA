import { useState } from "react";
import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import { MONTHS, TIMELINE_SERIES } from "../data/mockData";
import CountUp from "../components/Widgets/CountUp";

export default function Timeline() {
  const [idx, setIdx] = useState(MONTHS.length - 1);
  const current = TIMELINE_SERIES[idx];

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <HUDFrame label={`FOREST STATE · ${current.month} 2026`} scanline className="relative min-h-0 flex-1 overflow-hidden">
        <motion.div key={idx} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="h-full w-full">
          <ForestCanvasMap interactive />
        </motion.div>
        <div className="pointer-events-none absolute right-4 top-4 flex gap-6 font-mono text-[11px]">
          <MiniStat label="DENSITY" value={current.density} suffix="%" />
          <MiniStat label="COVER" value={current.coverKm2} suffix=" km²" />
          <MiniStat label="HOTSPOTS" value={current.hotspots} suffix="" color="var(--color-earth-400)" />
        </div>
      </HUDFrame>

      <HUDFrame label="TIME CONTROL" className="p-4">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={MONTHS.length - 1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            data-cursor-hover
            className="w-full cursor-ew-resize accent-gold-500"
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-ash-500">
            {MONTHS.map((m, i) => (
              <span key={m} className={i === idx ? "text-gold-400" : ""}>{m}</span>
            ))}
          </div>
        </div>
      </HUDFrame>
    </div>
  );
}

function MiniStat({ label, value, suffix, color }: { label: string; value: number; suffix: string; color?: string }) {
  return (
    <div className="border border-line/70 bg-void/70 px-3 py-1.5 text-right backdrop-blur-sm">
      <div className="text-ash-500">{label}</div>
      <div style={{ color: color ?? "var(--color-ash-100)" }}>
        <CountUp value={value} decimals={value % 1 !== 0 ? 1 : 0} duration={0.5} />
        {suffix}
      </div>
    </div>
  );
}
