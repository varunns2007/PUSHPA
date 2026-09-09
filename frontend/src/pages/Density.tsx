import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import { DENSITY_BUCKETS, ANALYTICS_SUMMARY } from "../data/mockData";
import CountUp from "../components/Widgets/CountUp";

export default function Density() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
      <HUDFrame label="CANOPY DENSITY · DEMO DATA" className="relative overflow-hidden">
        <DensityHeatmap />
      </HUDFrame>

      <div className="flex flex-col gap-4">
        <HUDFrame label="LEGEND" className="p-4">
          <div className="space-y-2.5">
            {DENSITY_BUCKETS.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-2.5"
              >
                <span className="h-3 w-3 shrink-0" style={{ backgroundColor: b.color }} />
                <span className="flex-1 font-mono text-[11px] text-ash-300">{b.label}</span>
                <span className="font-mono text-[10px] text-ash-500">{b.range}</span>
                <span className="w-9 text-right font-mono text-[11px] text-gold-400">{b.pct}%</span>
              </motion.div>
            ))}
          </div>
        </HUDFrame>

        <HUDFrame label="REGION METRICS" className="grid flex-1 grid-cols-2 gap-3 p-4">
          <Metric label="Forest Density" value={ANALYTICS_SUMMARY.canopyDensityPct} suffix="%" decimals={1} />
          <Metric label="Canopy Coverage" value={68.2} suffix="%" decimals={1} />
          <Metric label="Vegetation Index" value={ANALYTICS_SUMMARY.vegetationHealthIndex} suffix="" decimals={2} />
          <Metric label="Area Covered" value={ANALYTICS_SUMMARY.forestAreaKm2} suffix=" km²" decimals={0} />
        </HUDFrame>
      </div>
    </div>
  );
}

function Metric({ label, value, suffix, decimals }: { label: string; value: number; suffix: string; decimals: number }) {
  return (
    <div className="border border-line/60 p-3">
      <div className="font-mono text-[9px] tracking-wider text-ash-500">{label.toUpperCase()}</div>
      <div className="mt-1 font-display text-xl text-ash-100">
        <CountUp value={value} decimals={decimals} />
        <span className="text-sm text-ash-500">{suffix}</span>
      </div>
    </div>
  );
}

function DensityHeatmap() {
  const cols = 22;
  const rows = 14;
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    // pseudo-cluster density pattern
    const cx = cols / 2, cy = rows / 2;
    const d = Math.hypot(x - cx, y - cy) / Math.hypot(cx, cy);
    const noise = Math.sin(x * 1.7) * Math.cos(y * 1.3) * 0.25;
    const val = Math.max(0, Math.min(1, 1 - d * 0.8 + noise));
    return val;
  });

  const colorFor = (v: number) => {
    if (v > 0.8) return "var(--color-forest-400)";
    if (v > 0.6) return "var(--color-forest-500)";
    if (v > 0.4) return "var(--color-gold-500)";
    if (v > 0.2) return "var(--color-earth-400)";
    return "var(--color-earth-700)";
  };

  return (
    <div className="grid h-full w-full gap-[2px] p-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {cells.map((v, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 + v * 0.75 }}
          transition={{ duration: 0.8, delay: (i % cols) * 0.012 + Math.floor(i / cols) * 0.02 }}
          style={{ backgroundColor: colorFor(v) }}
        />
      ))}
    </div>
  );
}
