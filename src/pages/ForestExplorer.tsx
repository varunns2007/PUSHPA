import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TabBar from "../components/Layout/TabBar";
import HUDFrame from "../components/HUD/HUDFrame";
import ForestTextureCanvas from "../components/Map/ForestTextureCanvas";
import ForestMap from "./ForestMap";
import Forest3D from "./Forest3D";
import { useComparison } from "../state/ComparisonContext";
import CountUp from "../components/Widgets/CountUp";

const TABS = [
  { id: "map", label: "Map View" },
  { id: "3d", label: "3D Forest" },
  { id: "density", label: "Tree Density" },
];

export default function ForestExplorer() {
  const [tab, setTab] = useState("map");
  const { comparison } = useComparison();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line/70 bg-bark/60 px-2">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <div className="hidden items-center gap-4 pr-4 font-mono text-[10px] text-ash-500 md:flex">
          <span>SHOWING: {comparison.beforeDate} → {comparison.afterDate}</span>
          <span className="text-earth-400">-{comparison.dropPct}% COVER</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {tab === "map" && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
              <ForestMap />
            </motion.div>
          )}
          {tab === "3d" && (
            <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full p-4">
              <HUDFrame label="3D FOREST · CLICK ANY SPOT TO ZOOM IN" className="h-full w-full overflow-hidden">
                <Forest3D />
              </HUDFrame>
            </motion.div>
          )}
          {tab === "density" && (
            <motion.div key="density" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_260px]">
              <HUDFrame label="TREE DENSITY · FROM YOUR LAST COMPARISON" className="overflow-hidden">
                <ForestTextureCanvas
                  densityGrid={comparison.lossGrid.map((v) => 1 - v)}
                  gridSize={comparison.gridSize}
                  seed={`${comparison.beforeDate}-${comparison.afterDate}`}
                  flagValuableLoss={!!comparison.valuableSpeciesLost}
                />
              </HUDFrame>
              <div className="flex flex-col gap-4">
                <HUDFrame label="WHAT THIS MEANS" className="p-4">
                  <Metric label="Tree cover before" value={comparison.densityBefore} suffix="%" />
                  <Metric label="Tree cover now" value={comparison.densityAfter} suffix="%" />
                  <Metric label="Lost since then" value={comparison.dropPct} suffix="%" negative />
                </HUDFrame>
                <HUDFrame label="LEGEND" className="space-y-2 p-4">
                  <Legend color="var(--color-forest-400)" label="Healthy — thick canopy" />
                  <Legend color="var(--color-gold-500)" label="Thinning" />
                  <Legend color="var(--color-earth-400)" label="Heavily cleared" />
                  <Legend color="var(--color-value-400)" label="High-value trees missing" />
                </HUDFrame>
                <p className="font-mono text-[10px] leading-relaxed text-ash-500">
                  This map redraws itself the moment you run a new comparison on the Satellite Compare page.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 shrink-0" style={{ backgroundColor: color }} />
      <span className="font-mono text-[11px] text-ash-300">{label}</span>
    </div>
  );
}
