import { motion } from "framer-motion";

const STOPS = [
  { at: 0.8, color: "var(--color-earth-500)" },
  { at: 0.55, color: "var(--color-earth-400)" },
  { at: 0.35, color: "var(--color-gold-500)" },
  { at: 0.18, color: "var(--color-forest-500)" },
  { at: 0, color: "var(--color-forest-400)" },
];

function colorFor(v: number) {
  // v = loss intensity (0 = healthy, 1 = fully cleared)
  return STOPS.find((s) => v >= s.at)?.color ?? "var(--color-forest-400)";
}

export default function LossHeatmapGrid({ grid, size, animate = true }: { grid: number[]; size: number; animate?: boolean }) {
  return (
    <div className="grid h-full w-full gap-[2px] p-3" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {grid.map((v, i) => (
        <motion.div
          key={i}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 0.25 + v * 0.75 }}
          transition={{ duration: 0.6, delay: animate ? (i % size) * 0.01 + Math.floor(i / size) * 0.015 : 0 }}
          style={{ backgroundColor: colorFor(v) }}
        />
      ))}
    </div>
  );
}
