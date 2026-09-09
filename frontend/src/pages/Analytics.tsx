import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import CountUp from "../components/Widgets/CountUp";
import { ANALYTICS_SUMMARY, TIMELINE_SERIES, riskColor } from "../data/mockData";

export default function Analytics() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-3">
      <HUDFrame label="FOREST AREA" className="p-4">
        <BigStat value={ANALYTICS_SUMMARY.forestAreaKm2} suffix=" km²" />
        <LineChart data={TIMELINE_SERIES.map((d) => d.coverKm2)} color="var(--color-forest-400)" />
      </HUDFrame>

      <HUDFrame label="CANOPY DENSITY" className="p-4">
        <BigStat value={ANALYTICS_SUMMARY.canopyDensityPct} suffix="%" decimals={1} />
        <LineChart data={TIMELINE_SERIES.map((d) => d.density)} color="var(--color-gold-500)" />
      </HUDFrame>

      <HUDFrame label="VEGETATION HEALTH" className="p-4">
        <BigStat value={ANALYTICS_SUMMARY.vegetationHealthIndex} suffix="" decimals={2} />
        <RadialGauge value={ANALYTICS_SUMMARY.vegetationHealthIndex} />
      </HUDFrame>

      <HUDFrame label="FOREST LOSS (YTD)" className="p-4 lg:col-span-2">
        <BigStat value={ANALYTICS_SUMMARY.forestLossKm2Ytd} suffix=" km²" color="var(--color-earth-400)" />
        <BarChart data={TIMELINE_SERIES.map((d, i) => (i === 0 ? 0 : TIMELINE_SERIES[i - 1].coverKm2 - d.coverKm2))} labels={TIMELINE_SERIES.map((d) => d.month)} color="var(--color-earth-400)" />
      </HUDFrame>

      <HUDFrame label="RISK DISTRIBUTION" className="p-4">
        <div className="space-y-3">
          {ANALYTICS_SUMMARY.riskDistribution.map((r, i) => (
            <div key={r.label}>
              <div className="mb-1 flex justify-between font-mono text-[10px] text-ash-500">
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
              <div className="h-2 w-full bg-line/60">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: riskColor(r.label as any) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.value / 6) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </HUDFrame>
    </div>
  );
}

function BigStat({ value, suffix, decimals = 0, color }: { value: number; suffix: string; decimals?: number; color?: string }) {
  return (
    <div className="mb-3 font-display text-3xl" style={{ color: color ?? "var(--color-ash-100)" }}>
      <CountUp value={value} decimals={decimals} />
      <span className="text-base text-ash-500">{suffix}</span>
    </div>
  );
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  const w = 260, h = 70;
  const max = Math.max(...data), min = Math.min(...data);
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
      <motion.path d={path} fill="none" stroke={color} strokeWidth={2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: "easeOut" }} />
    </svg>
  );
}

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-28 items-end gap-3">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <motion.div
            className="w-full"
            style={{ backgroundColor: color }}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 90}px` }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
          />
          <span className="font-mono text-[9px] text-ash-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function RadialGauge({ value }: { value: number }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 110 110" className="mx-auto h-28 w-28 -rotate-90">
      <circle cx={55} cy={55} r={r} fill="none" stroke="var(--color-line)" strokeWidth={8} />
      <motion.circle
        cx={55}
        cy={55}
        r={r}
        fill="none"
        stroke="var(--color-forest-400)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value) }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}
