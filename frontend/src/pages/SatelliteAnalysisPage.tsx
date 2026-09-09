import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import BackendBadge from "../components/Backend/BackendBadge";
import CountUp from "../components/Widgets/CountUp";
import { compareNdvi, getForests } from "../api/client";
import { SATELLITE_DEMO } from "../data/mockData";

const TIER_COLOR: Record<string, string> = {
  BARE_SOIL_CLEARED: "var(--color-earth-700)",
  SPARSE_VEGETATION: "var(--color-earth-400)",
  MODERATE_DECIDUOUS: "var(--color-gold-500)",
  DENSE_EVERGREEN: "var(--color-forest-500)",
  PRISTINE_HIGH_CANOPY: "var(--color-forest-400)",
};

export default function SatelliteAnalysisPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [zoneId, setZoneId] = useState("ZONE-A");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    getForests().then((res) => {
      if (res.ok) setZones(res.data.zones);
    });
  }, []);

  const runQuery = async () => {
    setLoading(true);
    const res = await compareNdvi(zoneId);
    if (res.ok) {
      setResult(res.data);
      setUsingDemo(false);
    } else {
      setResult(null);
      setUsingDemo(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const before = result?.before ?? SATELLITE_DEMO.before;
  const after = result?.after ?? SATELLITE_DEMO.after;
  const tiers = after?.tiers ?? SATELLITE_DEMO.tiers;
  const zoneName = zones.find((z) => z.id === zoneId)?.name ?? SATELLITE_DEMO.zone;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg tracking-wide text-ash-100">Satellite Analysis</h1>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">Copernicus Sentinel-2 Level-2A · NDVI query</p>
        </div>
        <div className="flex items-center gap-2">
          {zones.length > 0 && (
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="border border-line/70 bg-panel/60 px-2 py-1.5 font-mono text-[11px] text-ash-100"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          )}
          <button
            data-cursor-hover
            onClick={runQuery}
            disabled={loading}
            className="border border-gold-500/50 px-3 py-1.5 font-mono text-[11px] tracking-wider text-gold-400 transition-colors hover:bg-gold-500/10 disabled:opacity-50"
          >
            {loading ? "QUERYING…" : "RUN QUERY"}
          </button>
          <BackendBadge />
        </div>
      </div>

      <div className="mb-4 font-mono text-[11px] text-ash-500">{zoneName}</div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HUDFrame label={`BEFORE · ${before.date}`} className="p-4">
          <BigStat value={before.mean_ndvi} label="MEAN NDVI" decimals={3} />
          <BigStat value={before.canopy_density_pct} label="CANOPY DENSITY" suffix="%" decimals={1} />
        </HUDFrame>
        <HUDFrame label={`AFTER · ${after.date}`} className="p-4">
          <BigStat value={after.mean_ndvi} label="MEAN NDVI" decimals={3} color="var(--color-earth-400)" />
          <BigStat value={after.canopy_density_pct} label="CANOPY DENSITY" suffix="%" decimals={1} color="var(--color-earth-400)" />
        </HUDFrame>
      </div>

      <HUDFrame label="VEGETATION TIER DISTRIBUTION · AFTER" className="mt-4 p-4">
        <div className="space-y-2.5">
          {tiers.map((t: any, i: number) => (
            <motion.div
              key={t.tier}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2.5"
            >
              <span className="h-3 w-3 shrink-0" style={{ backgroundColor: TIER_COLOR[t.tier] }} />
              <span className="w-48 font-mono text-[11px] text-ash-300">{t.tier.replaceAll("_", " ")}</span>
              <div className="h-1.5 flex-1 bg-line/60">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: TIER_COLOR[t.tier] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${t.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="w-12 text-right font-mono text-[11px] text-gold-400">{t.pct}%</span>
            </motion.div>
          ))}
        </div>
      </HUDFrame>

      {usingDemo && (
        <p className="mt-3 font-mono text-[10px] text-ash-700">
          Backend not reachable — showing bundled demo NDVI figures. Start the FastAPI server in /backend for live synthetic satellite queries.
        </p>
      )}
    </div>
  );
}

function BigStat({ value, label, suffix = "", decimals = 0, color }: { value: number; label: string; suffix?: string; decimals?: number; color?: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="font-mono text-[9px] tracking-wider text-ash-500">{label}</div>
      <div className="font-display text-2xl" style={{ color: color ?? "var(--color-ash-100)" }}>
        <CountUp value={value} decimals={decimals} />
        <span className="text-sm text-ash-500">{suffix}</span>
      </div>
    </div>
  );
}
