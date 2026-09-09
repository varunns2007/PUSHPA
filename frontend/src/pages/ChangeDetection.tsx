import { useRef, useState } from "react";
import HUDFrame from "../components/HUD/HUDFrame";
import CountUp from "../components/Widgets/CountUp";

function generatePattern(seedShift: number) {
  const cols = 30, rows = 18;
  return Array.from({ length: cols * rows }, (_, i) => {
    const x = i % cols, y = Math.floor(i / cols);
    const cx = cols / 2, cy = rows / 2;
    const d = Math.hypot(x - cx, y - cy) / Math.hypot(cx, cy);
    const noise = Math.sin((x + seedShift) * 1.3) * Math.cos((y + seedShift) * 1.1) * 0.3;
    return Math.max(0, Math.min(1, 1 - d * 0.75 + noise));
  });
}

export default function ChangeDetection() {
  const before = useRef(generatePattern(0)).current;
  const after = useRef(before.map((v, i) => (i % 7 === 0 ? Math.max(0, v - 0.45) : v * 0.92))).current;
  const [slider, setSlider] = useState(50);
  const cols = 30;

  const colorFor = (v: number) =>
    v > 0.75 ? "var(--color-forest-400)" : v > 0.5 ? "var(--color-forest-700)" : v > 0.28 ? "var(--color-gold-600)" : "var(--color-earth-700)";

  const lossCells = before.filter((v, i) => v - after[i] > 0.3).length;

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_280px]">
      <HUDFrame label="CHANGE DETECTION · JAN 2026 → JUN 2026" className="relative flex flex-col overflow-hidden">
        <div className="relative flex-1 select-none overflow-hidden">
          <div className="absolute inset-0 grid gap-[1px] p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {after.map((v, i) => (
              <div key={i} style={{ backgroundColor: colorFor(v) }} />
            ))}
          </div>
          <div
            className="absolute inset-0 grid gap-[1px] overflow-hidden p-2"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, clipPath: `inset(0 ${100 - slider}% 0 0)` }}
          >
            {before.map((v, i) => (
              <div key={i} style={{ backgroundColor: colorFor(v) }} />
            ))}
          </div>

          <div className="pointer-events-none absolute top-0 h-full w-[2px] bg-gold-400 shadow-[0_0_12px_2px_rgba(201,162,75,0.7)]" style={{ left: `${slider}%` }} />

          <div className="pointer-events-none absolute left-3 top-3 border border-line/70 bg-void/70 px-2 py-1 font-mono text-[10px] tracking-wider text-ash-300 backdrop-blur-sm">
            FOREST · JAN 2026
          </div>
          <div className="pointer-events-none absolute right-3 top-3 border border-line/70 bg-void/70 px-2 py-1 font-mono text-[10px] tracking-wider text-ash-300 backdrop-blur-sm">
            FOREST · JUN 2026
          </div>
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
        <HUDFrame label="SUMMARY" className="grid grid-cols-2 gap-3 p-4">
          <Metric label="Density Before" value={82} suffix="%" />
          <Metric label="Density After" value={75} suffix="%" />
          <Metric label="Change" value={-7} suffix="%" negative />
          <Metric label="Affected Area" value={lossCells * 2.6} suffix=" ha" />
        </HUDFrame>

        <HUDFrame label="NOTE" className="p-4">
          <p className="font-mono text-[11px] leading-relaxed text-ash-500">
            Highlighted cells indicate probable forest-loss zones between the two capture dates. Drag the slider
            above to compare imagery directly. This is simulated demo data for presentation purposes.
          </p>
        </HUDFrame>
      </div>
    </div>
  );
}

function Metric({ label, value, suffix, negative }: { label: string; value: number; suffix: string; negative?: boolean }) {
  return (
    <div className="border border-line/60 p-3">
      <div className="font-mono text-[9px] tracking-wider text-ash-500">{label.toUpperCase()}</div>
      <div className={`mt-1 font-display text-xl ${negative ? "text-earth-400" : "text-ash-100"}`}>
        <CountUp value={value} decimals={0} />
        <span className="text-sm text-ash-500">{suffix}</span>
      </div>
    </div>
  );
}
