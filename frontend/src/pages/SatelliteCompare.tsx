import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import CountUp from "../components/Widgets/CountUp";
import { useComparison, generateLossGrid } from "../state/ComparisonContext";
import { HOTSPOTS } from "../data/mockData";
import type { PageId } from "../nav";

const MONTH_PRESETS = [
  { label: "JAN", date: "2026-01-05" },
  { label: "FEB", date: "2026-02-04" },
  { label: "MAR", date: "2026-03-06" },
  { label: "APR", date: "2026-04-05" },
  { label: "MAY", date: "2026-05-05" },
  { label: "JUN", date: "2026-06-04" },
];

const COVER_LABELS = [
  { label: "Thick, healthy forest", threshold: 0.8, color: "var(--color-forest-400)" },
  { label: "Good tree cover", threshold: 0.6, color: "var(--color-forest-500)" },
  { label: "Thinning cover", threshold: 0.4, color: "var(--color-gold-500)" },
  { label: "Sparse / damaged", threshold: 0.2, color: "var(--color-earth-400)" },
  { label: "Bare or cleared ground", threshold: 0, color: "var(--color-earth-700)" },
];

function seededPattern(seed: string, size: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    hash = (hash * 1103515245 + 12345) >>> 0;
    return (hash % 1000) / 1000;
  };
  const cx = size / 2, cy = size / 2;
  return Array.from({ length: size * size }, (_, i) => {
    const x = i % size, y = Math.floor(i / size);
    const d = Math.hypot(x - cx, y - cy) / Math.hypot(cx, cy);
    return Math.max(0, Math.min(1, 1 - d * 0.75 + (rand() - 0.5) * 0.3));
  });
}

export default function SatelliteCompare({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  const { comparison, setComparison } = useComparison();
  const [beforeDate, setBeforeDate] = useState(comparison.beforeDate);
  const [afterDate, setAfterDate] = useState(comparison.afterDate);
  const [slider, setSlider] = useState(50);
  const [justUpdated, setJustUpdated] = useState(false);

  const size = 26;
  const beforePattern = useMemo(() => seededPattern(beforeDate, size), [beforeDate]);
  const afterPattern = useMemo(() => seededPattern(afterDate, size), [afterDate]);

  const colorFor = (v: number) => COVER_LABELS.find((c) => v >= c.threshold)?.color ?? "var(--color-earth-700)";

  const runComparison = () => {
    const beforeMean = beforePattern.reduce((a, b) => a + b, 0) / beforePattern.length;
    const afterMean = afterPattern.reduce((a, b) => a + b, 0) / afterPattern.length;
    const dropPct = Math.max(0, Math.round(((beforeMean - afterMean) / beforeMean) * 1000) / 10);
    const severity = Math.min(0.85, 0.15 + dropPct / 60);
    const seedNum = afterDate.split("-").reduce((a, c) => a + c.charCodeAt(0), 0);
    const valuableSpeciesLost = dropPct > 15 ? HOTSPOTS.find((h) => h.valuableSpecies)?.valuableSpecies ?? null : null;

    setComparison({
      beforeDate,
      afterDate,
      densityBefore: Math.round(beforeMean * 1000) / 10,
      densityAfter: Math.round(afterMean * 1000) / 10,
      dropPct,
      valuableSpeciesLost,
      lossGrid: generateLossGrid(18, severity, seedNum),
      gridSize: 18,
    });
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2400);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h1 className="font-display text-lg tracking-wide text-ash-100">Compare Two Dates</h1>
        <p className="mt-0.5 max-w-xl font-mono text-[11px] leading-relaxed text-ash-500">
          Pick an earlier and a more recent satellite photo of the forest. PUSHPA lines them up and shows you
          exactly what changed — this also updates the heatmap in Forest Explorer.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <DateField label="Earlier photo" value={beforeDate} onChange={setBeforeDate} />
        <DateField label="Recent photo" value={afterDate} onChange={setAfterDate} />
        <div className="flex gap-1">
          {MONTH_PRESETS.map((m) => (
            <button
              key={m.label}
              data-cursor-hover
              onClick={() => setAfterDate(m.date)}
              className={`border px-2 py-1.5 font-mono text-[10px] transition-colors ${
                afterDate === m.date ? "border-gold-500/60 text-gold-400" : "border-line/60 text-ash-500 hover:text-ash-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          data-cursor-hover
          onClick={runComparison}
          className="border border-gold-500/50 bg-gold-500/10 px-4 py-1.5 font-mono text-[11px] tracking-wider text-gold-400 transition-colors hover:bg-gold-500/20"
        >
          COMPARE NOW
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <HUDFrame label={`${beforeDate}  →  ${afterDate}`} className="relative flex flex-col overflow-hidden">
          <div className="relative aspect-[16/9] select-none overflow-hidden">
            <div className="absolute inset-0 grid gap-[1px] p-2" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
              {afterPattern.map((v, i) => <div key={i} style={{ backgroundColor: colorFor(v) }} />)}
            </div>
            <div
              className="absolute inset-0 grid gap-[1px] overflow-hidden p-2"
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, clipPath: `inset(0 ${100 - slider}% 0 0)` }}
            >
              {beforePattern.map((v, i) => <div key={i} style={{ backgroundColor: colorFor(v) }} />)}
            </div>
            <div className="pointer-events-none absolute top-0 h-full w-[2px] bg-gold-400 shadow-[0_0_12px_2px_rgba(201,162,75,0.7)]" style={{ left: `${slider}%` }} />
            <div className="pointer-events-none absolute left-3 top-3 border border-line/70 bg-void/70 px-2 py-1 font-mono text-[10px] text-ash-300 backdrop-blur-sm">EARLIER</div>
            <div className="pointer-events-none absolute right-3 top-3 border border-line/70 bg-void/70 px-2 py-1 font-mono text-[10px] text-ash-300 backdrop-blur-sm">RECENT</div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(Number(e.target.value))}
            data-cursor-hover
            className="h-8 w-full cursor-ew-resize appearance-none bg-transparent px-4 accent-gold-500"
          />
        </HUDFrame>

        <div className="flex flex-col gap-4">
          <HUDFrame label="WHAT CHANGED" className="p-4">
            <Metric label="Forest cover before" value={comparison.densityBefore} suffix="%" />
            <Metric label="Forest cover now" value={comparison.densityAfter} suffix="%" />
            <Metric label="Amount lost" value={comparison.dropPct} suffix="%" negative />
          </HUDFrame>

          {comparison.valuableSpeciesLost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-value-500/60 bg-value-600/10 p-3"
            >
              <div className="font-mono text-[10px] tracking-wider text-value-400">HIGH-VALUE TREES MISSING</div>
              <div className="mt-1 font-display text-sm text-value-300">{comparison.valuableSpeciesLost}</div>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ash-500">
                This clearing overlaps a species that's frequently smuggled. Flagged with priority.
              </p>
            </motion.div>
          )}

          <button
            data-cursor-hover
            onClick={() => onNavigate("forest-explorer")}
            className="border border-signal-400/40 bg-signal-500/10 px-3 py-2 font-mono text-[11px] tracking-wider text-signal-400 transition-colors hover:bg-signal-500/20"
          >
            VIEW THIS IN FOREST EXPLORER →
          </button>

          {justUpdated && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[10px] text-signal-400">
              ✓ Forest Explorer heatmap updated.
            </motion.div>
          )}
        </div>
      </div>

      <HUDFrame label="TREE COVER, SIMPLY" className="mt-4 p-4">
        <div className="flex flex-wrap gap-4">
          {COVER_LABELS.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="h-3 w-3" style={{ backgroundColor: c.color }} />
              <span className="font-mono text-[11px] text-ash-300">{c.label}</span>
            </div>
          ))}
        </div>
      </HUDFrame>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-wider text-ash-500">{label.toUpperCase()}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-cursor-hover
        className="border border-line/70 bg-panel/60 px-2 py-1.5 font-mono text-[11px] text-ash-100"
      />
    </label>
  );
}

function Metric({ label, value, suffix, negative }: { label: string; value: number; suffix: string; negative?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="font-mono text-[9px] tracking-wider text-ash-500">{label.toUpperCase()}</div>
      <div className={`font-display text-xl ${negative ? "text-earth-400" : "text-ash-100"}`}>
        <CountUp value={value} decimals={1} />
        <span className="text-sm text-ash-500">{suffix}</span>
      </div>
    </div>
  );
}
