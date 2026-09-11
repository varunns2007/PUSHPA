import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import { ANALYTICS_SUMMARY, HOTSPOTS, REGION, TIMELINE_SERIES, riskColor } from "../data/mockData";
import CountUp from "../components/Widgets/CountUp";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import DemoScenarioButton from "../components/Demo/DemoScenarioButton";
import type { PageId } from "../nav";

export default function Overview({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] tracking-wider text-ash-500">COMMAND CENTER</span>
            <button
              type="button"
              data-cursor-hover
              onClick={() => onNavigate("range-detector")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded border border-gold-500/50 bg-gold-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-gold-300 hover:bg-gold-500/25 transition-colors shadow-[0_0_8px_rgba(234,179,8,0.2)]"
            >
              <span>⌖</span> SCAN ANY FOREST RANGE FOR DEFORESTATION ➔
            </button>
          </div>
          <DemoScenarioButton />
        </div>
        <HUDFrame label="FOREST REGION · MONITORING ACTIVE" scanline className="min-h-[320px] flex-1 overflow-hidden">
          <ForestCanvasMap onOpen={() => onNavigate("forest-explorer")} />
        </HUDFrame>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "TREE COVER", value: ANALYTICS_SUMMARY.canopyDensityPct, suffix: "%" },
            { label: "FOREST SIZE", value: ANALYTICS_SUMMARY.forestAreaKm2, suffix: " km²" },
            { label: "TROUBLE SPOTS", value: ANALYTICS_SUMMARY.hotspotCount, suffix: "" },
            { label: "LOST THIS YEAR", value: ANALYTICS_SUMMARY.forestLossKm2Ytd, suffix: " km²" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              className="border border-line/70 bg-panel/40 p-4"
            >
              <div className="font-mono text-[10px] tracking-[0.15em] text-ash-500">{s.label}</div>
              <div className="mt-1 font-display text-2xl text-ash-100">
                <CountUp value={s.value} decimals={s.value % 1 !== 0 ? 1 : 0} />
                <span className="text-base text-ash-500">{s.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">
        <HUDFrame label="RISK SUMMARY" className="p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-xs text-ash-500">REGION</span>
            <span className="font-mono text-xs text-gold-400">{REGION.code}</span>
          </div>
          <div className="space-y-2">
            {ANALYTICS_SUMMARY.riskDistribution.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="w-20 font-mono text-[10px] text-ash-500">{r.label}</span>
                <div className="h-1.5 flex-1 bg-line/60">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: riskColor(r.label as any) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.value / 6) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="w-4 text-right font-mono text-[10px] text-ash-300">{r.value}</span>
              </div>
            ))}
          </div>
        </HUDFrame>

        <HUDFrame label="RECENT HOTSPOTS" className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1.5 p-1.5">
            {HOTSPOTS.slice(0, 4).map((h, i) => (
              <motion.button
                data-cursor-hover
                key={h.id}
                onClick={() => onNavigate("threat-intel")}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex w-full items-center justify-between border border-line/60 bg-panel/50 px-3 py-2 text-left transition-colors hover:border-gold-500/40"
              >
                <div>
                  <div className="font-mono text-[11px] text-ash-100">{h.id}</div>
                  <div className="text-[11px] text-ash-500">{h.label}</div>
                </div>
                <span
                  className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-wider"
                  style={{ color: riskColor(h.risk), border: `1px solid ${riskColor(h.risk)}55` }}
                >
                  {h.risk}
                </span>
              </motion.button>
            ))}
          </div>
        </HUDFrame>

        <HUDFrame label="6-MONTH TREE COVER TREND" className="p-4">
          <MiniTrend />
        </HUDFrame>
      </div>
    </div>
  );
}

function MiniTrend() {
  const points = TIMELINE_SERIES.map((d) => d.density);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 260;
  const h = 60;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
      <motion.path
        d={path}
        fill="none"
        stroke="var(--color-forest-400)"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((p - min) / (max - min || 1)) * h;
        return <circle key={i} cx={x} cy={y} r={2.2} fill="var(--color-gold-400)" />;
      })}
    </svg>
  );
}
