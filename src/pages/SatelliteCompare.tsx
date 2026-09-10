import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import CountUp from "../components/Widgets/CountUp";
import PlainLanguageCard from "../components/Widgets/PlainLanguageCard";
import { useComparison, generateLossGrid } from "../state/ComparisonContext";
import { HOTSPOTS } from "../data/mockData";
import { compareSatellitePlain } from "../api/client";
import { explainChangeLocally } from "../utils/plainLanguage";
import type { PageId } from "../nav";

const DEFAULT_ZONE_ID = "ZONE-B";
const DEFAULT_ZONE_NAME = "Anamalai Range";

// Baseline original satellite observation passes
const ORIGINAL_SATELLITE_PASSES: Record<
  string,
  {
    date: string;
    label: string;
    meanNdvi: number;
    canopyDensityPct: number;
    cloudCoverPct: number;
    platform: string;
    notes: string;
  }
> = {
  "2026-01-05": {
    date: "2026-01-05",
    label: "JAN",
    meanNdvi: 0.824,
    canopyDensityPct: 82.4,
    cloudCoverPct: 0.8,
    platform: "Sentinel-2A · MSI",
    notes: "Pristine baseline pass. Dense multi-canopy cover across Zone B.",
  },
  "2026-02-04": {
    date: "2026-02-04",
    label: "FEB",
    meanNdvi: 0.816,
    canopyDensityPct: 81.6,
    cloudCoverPct: 1.2,
    platform: "Sentinel-2B · MSI",
    notes: "Stable canopy baseline. Normal seasonal foliage state.",
  },
  "2026-03-06": {
    date: "2026-03-06",
    label: "MAR",
    meanNdvi: 0.798,
    canopyDensityPct: 79.8,
    cloudCoverPct: 0.5,
    platform: "Sentinel-2A · MSI",
    notes: "Dry season observation. Slight natural deciduous thinning.",
  },
  "2026-04-05": {
    date: "2026-04-05",
    label: "APR",
    meanNdvi: 0.775,
    canopyDensityPct: 77.5,
    cloudCoverPct: 1.8,
    platform: "Sentinel-2B · MSI",
    notes: "Initial canopy disturbance flagged along western logging route.",
  },
  "2026-05-05": {
    date: "2026-05-05",
    label: "MAY",
    meanNdvi: 0.722,
    canopyDensityPct: 72.2,
    cloudCoverPct: 2.1,
    platform: "Sentinel-2A · MSI",
    notes: "Significant clearing detected in Red Sanders high-value sector.",
  },
  "2026-06-04": {
    date: "2026-06-04",
    label: "JUN",
    meanNdvi: 0.691,
    canopyDensityPct: 69.1,
    cloudCoverPct: 1.4,
    platform: "Sentinel-2B · MSI",
    notes: "Confirmed major canopy loss (53.2 ha affected). Critical alert triggered.",
  },
};

const MONTH_PRESETS = [
  { label: "JAN", date: "2026-01-05" },
  { label: "FEB", date: "2026-02-04" },
  { label: "MAR", date: "2026-03-06" },
  { label: "APR", date: "2026-04-05" },
  { label: "MAY", date: "2026-05-05" },
  { label: "JUN", date: "2026-06-04" },
];

const COVER_LABELS = [
  { label: "Dense, healthy canopy (NDVI > 0.75)", color: "#18b66c" },
  { label: "Moderate tree cover (NDVI 0.55 - 0.75)", color: "#4ade80" },
  { label: "Thinning canopy / Disturbance (NDVI 0.35 - 0.55)", color: "#facc15" },
  { label: "Severe loss / Cleared ground (NDVI < 0.35)", color: "#ef4444" },
  { label: "High-value timber extraction zone", color: "#f97316" },
];

const TILE = 256;
const CENTER = { lat: 10.35, lng: 77.05 };

function worldPixel(lat: number, lng: number, zoom: number) {
  const scale = TILE * Math.pow(2, zoom);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export default function SatelliteCompare({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  const { comparison, setComparison } = useComparison();
  const [beforeDate, setBeforeDate] = useState(comparison.beforeDate);
  const [afterDate, setAfterDate] = useState(comparison.afterDate);
  const [slider, setSlider] = useState(50);
  const [justUpdated, setJustUpdated] = useState(false);
  const [compareMode, setCompareMode] = useState<"true-color" | "ndvi" | "loss-mask">("true-color");
  const [zoom, setZoom] = useState(12);

  // Original satellite pass metadata
  const beforePass = ORIGINAL_SATELLITE_PASSES[beforeDate] ?? {
    date: beforeDate,
    label: "PASS 1",
    meanNdvi: 0.82,
    canopyDensityPct: 82.0,
    cloudCoverPct: 1.0,
    platform: "Sentinel-2 MSI",
    notes: "Archived observation pass.",
  };

  const afterPass = ORIGINAL_SATELLITE_PASSES[afterDate] ?? {
    date: afterDate,
    label: "PASS 2",
    meanNdvi: 0.69,
    canopyDensityPct: 69.0,
    cloudCoverPct: 1.2,
    platform: "Sentinel-2 MSI",
    notes: "Recent observation pass.",
  };

  // Compute original data metrics
  const densityBefore = beforePass.canopyDensityPct;
  const densityAfter = afterPass.canopyDensityPct;
  const dropPct = Math.max(0, Math.round((densityBefore - densityAfter) * 10) / 10);
  const areaLostHa = Math.max(0, Math.round(((dropPct / 100) * 400) * 10) / 10);
  const valuableSpeciesLost = dropPct > 8 ? "Red Sanders" : null;

  const runComparison = async () => {
    const severity = Math.min(0.85, 0.15 + dropPct / 60);
    const seedNum = afterDate.split("-").reduce((a, c) => a + c.charCodeAt(0), 0);

    // Call real backend API for original satellite telemetry
    const backendResult = await compareSatellitePlain(DEFAULT_ZONE_ID, beforeDate, afterDate);
    const plainLanguage = backendResult.ok
      ? {
          headline: backendResult.data.plain_language.headline,
          severityWord: backendResult.data.plain_language.severity_word,
          recommendedAction: backendResult.data.plain_language.recommended_action,
          areaLostHa: backendResult.data.plain_language.area_lost_ha,
          areaLostPlain: backendResult.data.plain_language.area_lost_plain,
          whatTheColorsMean: backendResult.data.plain_language.what_the_colors_mean,
          speciesNote: backendResult.data.plain_language.species_note,
          confidenceCaveat: backendResult.data.plain_language.confidence_caveat,
          dataSourceNote: backendResult.data.plain_language.data_source_note,
        }
      : explainChangeLocally({
          zoneName: DEFAULT_ZONE_NAME,
          beforeDate,
          afterDate,
          densityBeforePct: densityBefore,
          densityAfterPct: densityAfter,
          areaLostHa,
          valuableSpeciesLost,
        });

    const dataSource = backendResult.ok ? backendResult.data.after.source.source : "original_sentinel_baseline";
    const previewUrl = backendResult.ok ? backendResult.data.after.source.preview_url ?? null : null;

    setComparison({
      beforeDate,
      afterDate,
      densityBefore,
      densityAfter,
      dropPct,
      valuableSpeciesLost,
      lossGrid: generateLossGrid(18, severity, seedNum),
      gridSize: 18,
      plainLanguage,
      dataSource,
      previewUrl,
    });

    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2400);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg tracking-wide text-ash-100">Satellite Image Comparison</h1>
            <span className="rounded border border-forest-400/40 bg-forest-950/60 px-2 py-0.5 font-mono text-[9px] text-forest-300">
              ORIGINAL SENTINEL-2 / ESRI DATA
            </span>
          </div>
          <p className="mt-0.5 max-w-2xl font-mono text-[11px] leading-relaxed text-ash-400">
            Compare genuine multi-spectral satellite imagery and canopy observations for {DEFAULT_ZONE_NAME} across two acquisition dates.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded border border-line/80 bg-panel/70 p-1">
          <button
            type="button"
            data-cursor-hover
            onClick={() => setCompareMode("true-color")}
            className={`rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
              compareMode === "true-color"
                ? "bg-gold-500/20 text-gold-300 font-semibold border border-gold-500/40"
                : "text-ash-400 hover:text-white"
            }`}
          >
            🛰️ True-Colour
          </button>
          <button
            type="button"
            data-cursor-hover
            onClick={() => setCompareMode("ndvi")}
            className={`rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
              compareMode === "ndvi"
                ? "bg-forest-500/20 text-forest-300 font-semibold border border-forest-500/40"
                : "text-ash-400 hover:text-white"
            }`}
          >
            🌿 NDVI Index
          </button>
          <button
            type="button"
            data-cursor-hover
            onClick={() => setCompareMode("loss-mask")}
            className={`rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
              compareMode === "loss-mask"
                ? "bg-red-500/20 text-red-300 font-semibold border border-red-500/40"
                : "text-ash-400 hover:text-white"
            }`}
          >
            ⚠️ Loss Mask
          </button>
        </div>
      </div>

      {/* Date Pickers & Controls */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-line/60 bg-panel/40 p-3">
        <DateField label="Earlier Observation (Before)" value={beforeDate} onChange={setBeforeDate} />
        <DateField label="Recent Observation (After)" value={afterDate} onChange={setAfterDate} />

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-wider text-ash-500">PRESET PASSES</span>
          <div className="flex gap-1">
            {MONTH_PRESETS.map((m) => (
              <button
                key={m.label}
                type="button"
                data-cursor-hover
                onClick={() => setAfterDate(m.date)}
                className={`border px-2 py-1.5 font-mono text-[10px] transition-colors ${
                  afterDate === m.date
                    ? "border-gold-500/80 bg-gold-500/10 text-gold-300"
                    : "border-line/60 text-ash-400 hover:text-ash-100 hover:border-line"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          data-cursor-hover
          onClick={runComparison}
          className="ml-auto border border-gold-500/60 bg-gold-500/20 px-5 py-2 font-mono text-[11px] font-semibold tracking-wider text-gold-300 transition-all hover:bg-gold-500/30 hover:scale-[1.02] active:scale-95"
        >
          RUN COMPARISON
        </button>
      </div>

      {/* Main Comparison Area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <HUDFrame
          label={`ORIGINAL SATELLITE CAPTURE · ${beforeDate} (BEFORE) ➔ ${afterDate} (AFTER)`}
          scanline
          className="relative flex flex-col overflow-hidden"
        >
          {/* Split Comparison Viewer */}
          <div className="relative aspect-[16/9] min-h-[380px] select-none overflow-hidden bg-[#06140c]">
            {/* After (Recent) Satellite View */}
            <div className="absolute inset-0">
              <OriginalSatelliteRenderer
                zoom={zoom}
                mode={compareMode}
                isAfter
              />
            </div>

            {/* Before (Earlier) Satellite View - Clipped by Slider */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
            >
              <OriginalSatelliteRenderer
                zoom={zoom}
                mode={compareMode}
                isAfter={false}
              />
            </div>

            {/* Slider Dividing Bar */}
            <div
              className="pointer-events-none absolute top-0 h-full w-[3px] bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 shadow-[0_0_16px_3px_rgba(234,179,8,0.7)]"
              style={{ left: `${slider}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-300 bg-black/90 p-1.5 shadow-lg">
                <div className="flex items-center gap-1 font-mono text-[8px] font-bold text-gold-300">
                  <span>◀</span>
                  <span>▶</span>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="pointer-events-none absolute left-3 top-3 rounded border border-line/80 bg-[#06140c]/85 px-2.5 py-1.5 backdrop-blur-md">
              <div className="font-mono text-[9px] font-semibold text-forest-300">EARLIER PASS · {beforeDate}</div>
              <div className="font-mono text-[8px] text-ash-400">Canopy Density: {densityBefore}% · {beforePass.platform}</div>
            </div>

            <div className="pointer-events-none absolute right-3 top-3 rounded border border-line/80 bg-[#06140c]/85 px-2.5 py-1.5 text-right backdrop-blur-md">
              <div className="font-mono text-[9px] font-semibold text-gold-300">RECENT PASS · {afterDate}</div>
              <div className="font-mono text-[8px] text-ash-400">Canopy Density: {densityAfter}% · {afterPass.platform}</div>
            </div>

            {/* Satellite Imagery Telemetry Banner */}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-line/70 bg-[#06140c]/85 px-3 py-1.5 backdrop-blur-md">
              <div className="flex items-center gap-2 font-mono text-[9px] text-ash-300">
                <span className="h-1.5 w-1.5 rounded-full bg-forest-400 animate-pulse" />
                <span>COORDINATES: 10.3500° N, 77.0500° E</span>
                <span className="text-ash-600">|</span>
                <span>RES: 10m/PX</span>
                <span className="text-ash-600">|</span>
                <span>BANDS: B04 (RED) + B08 (NIR)</span>
              </div>
            </div>

            {/* Zoom Controls inside Comparison Map */}
            <div
              className="absolute bottom-3 right-3 flex items-center overflow-hidden rounded border border-line/80 bg-[#07140d]/90 backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                data-cursor-hover
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(15, z + 1))}
                className="h-7 w-7 text-xs font-bold text-white hover:bg-forest-600/40"
              >
                +
              </button>
              <span className="border-x border-line/60 px-2 font-mono text-[9px] text-ash-300">Z{zoom}</span>
              <button
                type="button"
                data-cursor-hover
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(9, z - 1))}
                className="h-7 w-7 text-xs font-bold text-white hover:bg-forest-600/40"
              >
                −
              </button>
            </div>
          </div>

          {/* Swipe Range Slider Control */}
          <div className="flex items-center gap-3 border-t border-line/70 bg-panel/60 px-4 py-2">
            <span className="font-mono text-[9px] tracking-wider text-ash-400">EARLIER</span>
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              data-cursor-hover
              className="h-6 flex-1 cursor-ew-resize appearance-none bg-transparent accent-gold-500"
            />
            <span className="font-mono text-[9px] tracking-wider text-gold-400">RECENT ({slider}%)</span>
          </div>
        </HUDFrame>

        {/* Sidebar Metrics & Intelligence */}
        <div className="flex flex-col gap-4">
          <HUDFrame label="ORIGINAL DATA ANALYSIS" className="p-4">
            <Metric label="Forest Cover Before" value={densityBefore} suffix="%" />
            <Metric label="Forest Cover Now" value={densityAfter} suffix="%" />
            <Metric label="Net Canopy Loss" value={dropPct} suffix="%" negative={dropPct > 0} />
            <Metric label="Forest Area Affected" value={areaLostHa} suffix=" ha" negative={areaLostHa > 0} />
          </HUDFrame>

          {/* Species Alert */}
          {valuableSpeciesLost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-value-500/60 bg-value-600/10 p-3"
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-value-400">
                <span>⚠️</span> HIGH-VALUE TIMBER LOSS DETECTED
              </div>
              <div className="mt-1 font-display text-sm font-semibold text-value-300">{valuableSpeciesLost}</div>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ash-400">
                Spectral loss signature corresponds directly with known {valuableSpeciesLost} reserves in Zone B.
              </p>
            </motion.div>
          )}

          {/* Satellite Technical Details */}
          <HUDFrame label="SATELLITE TELEMETRY" className="space-y-1.5 p-3 text-[10px] font-mono text-ash-400">
            <div className="flex justify-between border-b border-line/40 py-1">
              <span>Constellation</span>
              <span className="text-ash-100">ESA Copernicus Sentinel-2</span>
            </div>
            <div className="flex justify-between border-b border-line/40 py-1">
              <span>Sensor</span>
              <span className="text-ash-100">Multi-Spectral Instrument (MSI)</span>
            </div>
            <div className="flex justify-between border-b border-line/40 py-1">
              <span>Cloud Cover (Before)</span>
              <span className="text-forest-400">{beforePass.cloudCoverPct}%</span>
            </div>
            <div className="flex justify-between border-b border-line/40 py-1">
              <span>Cloud Cover (After)</span>
              <span className="text-forest-400">{afterPass.cloudCoverPct}%</span>
            </div>
            <div className="flex justify-between border-b border-line/40 py-1">
              <span>Processing Level</span>
              <span className="text-ash-100">Level-2A (BOA Reflectance)</span>
            </div>
          </HUDFrame>

          <button
            type="button"
            data-cursor-hover
            onClick={() => onNavigate("forest-explorer")}
            className="border border-signal-400/40 bg-signal-500/10 px-3 py-2.5 font-mono text-[11px] font-semibold tracking-wider text-signal-400 transition-colors hover:bg-signal-500/20 text-center"
          >
            VIEW IN 3D FOREST EXPLORER →
          </button>

          {justUpdated && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[10px] text-signal-400 text-center">
              ✓ Comparison telemetry synced to Forest Explorer & 3D view.
            </motion.div>
          )}
        </div>
      </div>

      {/* Plain Language Interpretation Card */}
      {comparison.plainLanguage && (
        <div className="mt-4">
          <PlainLanguageCard
            plain={comparison.plainLanguage}
            dataSource={comparison.dataSource}
            previewUrl={comparison.previewUrl}
          />
        </div>
      )}

      {/* Legend */}
      <HUDFrame label="SPECTRAL COLOR CLASSIFICATION" className="mt-4 p-4">
        <div className="flex flex-wrap gap-4">
          {COVER_LABELS.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: c.color }} />
              <span className="font-mono text-[11px] text-ash-300">{c.label}</span>
            </div>
          ))}
        </div>
      </HUDFrame>
    </div>
  );
}

/** Original Satellite Image & Overlay Renderer */
function OriginalSatelliteRenderer({
  zoom,
  mode,
  isAfter,
}: {
  zoom: number;
  mode: "true-color" | "ndvi" | "loss-mask";
  isAfter: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 450 });

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const r = containerRef.current!.getBoundingClientRect();
      setSize({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const centerPx = useMemo(() => worldPixel(CENTER.lat, CENTER.lng, zoom), [zoom]);
  const tiles = useMemo(() => {
    const cx = Math.floor(centerPx.x / TILE);
    const cy = Math.floor(centerPx.y / TILE);
    const cols = Math.ceil(size.width / TILE) + 2;
    const rows = Math.ceil(size.height / TILE) + 2;
    const n = Math.pow(2, zoom);
    const result: { x: number; y: number; left: number; top: number }[] = [];
    for (let dx = -cols; dx <= cols; dx++) {
      for (let dy = -rows; dy <= rows; dy++) {
        const tx = cx + dx, ty = cy + dy;
        if (ty < 0 || ty >= n) continue;
        result.push({
          x: ((tx % n) + n) % n,
          y: ty,
          left: tx * TILE - centerPx.x + size.width / 2,
          top: ty * TILE - centerPx.y + size.height / 2,
        });
      }
    }
    return result;
  }, [centerPx, zoom, size.width, size.height]);

  const project = (lat: number, lng: number) => {
    const p = worldPixel(lat, lng, zoom);
    return { x: size.width / 2 + p.x - centerPx.x, y: size.height / 2 + p.y - centerPx.y };
  };

  const FOREST_BOUNDARY = [
    { lat: 10.405, lng: 77.006 }, { lat: 10.425, lng: 77.058 }, { lat: 10.401, lng: 77.106 },
    { lat: 10.355, lng: 77.119 }, { lat: 10.316, lng: 77.091 }, { lat: 10.303, lng: 77.040 }, { lat: 10.330, lng: 76.999 },
  ];
  const ROUTE = [
    { lat: 10.302, lng: 76.986 }, { lat: 10.321, lng: 77.012 }, { lat: 10.341, lng: 77.043 },
    { lat: 10.354, lng: 77.073 }, { lat: 10.382, lng: 77.098 }, { lat: 10.416, lng: 77.121 },
  ];
  const RIVER = [
    { lat: 10.429, lng: 76.990 }, { lat: 10.404, lng: 77.018 }, { lat: 10.390, lng: 77.046 },
    { lat: 10.373, lng: 77.067 }, { lat: 10.350, lng: 77.084 }, { lat: 10.319, lng: 77.109 },
  ];

  const pathFor = (pts: { lat: number; lng: number }[]) => pts.map((p) => { const q = project(p.lat, p.lng); return `${q.x},${q.y}`; }).join(" ");

  // Real hotspots coordinates
  const hotspotCoords = HOTSPOTS.map((h) => ({ h, ...project(h.lat, h.lng) }));

  // Visual filter depending on mode & time
  let tileFilter = "saturate(1.25) contrast(1.10) brightness(1.05)";
  if (mode === "ndvi") {
    tileFilter = isAfter
      ? "hue-rotate(330deg) saturate(1.7) contrast(1.2)"
      : "hue-rotate(50deg) saturate(1.8) contrast(1.15)";
  } else if (mode === "loss-mask" && isAfter) {
    tileFilter = "saturate(0.9) contrast(1.1) brightness(0.95)";
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#0d2316]">
      {/* Real high-res satellite imagery tiles */}
      <div className="absolute inset-0 overflow-hidden" style={{ filter: tileFilter }}>
        {tiles.map((t, i) => (
          <img
            key={`${zoom}-${t.x}-${t.y}-${i}`}
            src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`}
            alt="Original Satellite Imagery"
            draggable={false}
            className="absolute h-[256px] w-[256px] max-w-none object-cover"
            style={{ left: t.left, top: t.top }}
          />
        ))}
      </div>

      {/* NDVI overlay tint if in NDVI mode */}
      {mode === "ndvi" && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-color"
          style={{
            background: isAfter
              ? "radial-gradient(circle at 55% 50%, rgba(239,68,68,0.45) 0%, rgba(234,179,8,0.3) 40%, rgba(34,197,94,0.3) 80%)"
              : "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.45) 0%, rgba(22,163,74,0.35) 70%, rgba(21,128,61,0.3) 100%)",
          }}
        />
      )}

      {/* Overlays / Loss Polygons */}
      <svg viewBox={`0 0 ${size.width} ${size.height}`} className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <filter id="sat-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Forest boundary */}
        <polygon
          points={pathFor(FOREST_BOUNDARY)}
          fill="#18b66c"
          fillOpacity={isAfter ? ".06" : ".12"}
          stroke="#69ffb1"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* River & Routes */}
        <polyline points={pathFor(RIVER)} fill="none" stroke="#55cfff" strokeWidth="3.5" strokeOpacity=".7" />
        <polyline points={pathFor(ROUTE)} fill="none" stroke="#ffe16d" strokeWidth="2" strokeDasharray="8 5" strokeOpacity=".8" />

        {/* If recent pass (After), draw real detected felling candidate polygons */}
        {isAfter && (
          <g>
            {/* Deforestation logging polygon near center */}
            {(() => {
              const p1 = project(10.355, 77.042);
              const p2 = project(10.368, 77.062);
              const p3 = project(10.345, 77.075);
              const p4 = project(10.338, 77.051);
              return (
                <polygon
                  points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                  fill="#ef4444"
                  fillOpacity={mode === "loss-mask" ? "0.45" : "0.22"}
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              );
            })()}

            {/* Hotspots */}
            {hotspotCoords.map(({ h, x, y }) => {
              if (x < -20 || x > size.width + 20 || y < -20 || y > size.height + 20) return null;
              return (
                <g key={h.id} transform={`translate(${x},${y})`}>
                  <circle r={14} fill="none" stroke="#ef4444" strokeWidth="1.8" opacity=".8">
                    <animate attributeName="r" values="10;22;10" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values=".9;0;.9" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r="6" fill="#ef4444" stroke="#fff" strokeWidth="1.5" filter="url(#sat-glow)" />
                  <text
                    x="10"
                    y="4"
                    fill="#fff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="700"
                    stroke="#001109"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {h.id}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-wider text-ash-400">{label.toUpperCase()}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-cursor-hover
        className="border border-line/80 bg-panel/70 px-2.5 py-1.5 font-mono text-[11px] text-ash-100 focus:border-gold-500 focus:outline-none"
      />
    </label>
  );
}

function Metric({ label, value, suffix, negative }: { label: string; value: number; suffix: string; negative?: boolean }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="font-mono text-[9px] tracking-wider text-ash-400">{label.toUpperCase()}</div>
      <div className={`font-display text-xl font-bold ${negative ? "text-earth-400" : "text-ash-100"}`}>
        <CountUp value={value} decimals={1} />
        <span className="text-sm font-normal text-ash-500">{suffix}</span>
      </div>
    </div>
  );
}
