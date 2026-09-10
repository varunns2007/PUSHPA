import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getConvoySignatures, listPoliceStations, policeDispatchLog } from "../api/client";
import { riskColor, type RiskLevel } from "../data/mockData";

const POLL_MS = 6000;

export default function PoliceDispatch() {
  const [stations, setStations] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [convoys, setConvoys] = useState<any[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [s, d, c] = await Promise.all([listPoliceStations(), policeDispatchLog(20), getConvoySignatures()]);
      if (cancelled) return;
      if (s.ok) {
        setStations(s.data.stations);
        setLive(true);
      } else {
        setLive(false);
      }
      if (d.ok) setDispatches(d.data.dispatches);
      if (c.ok) setConvoys(c.data.signatures);
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg tracking-wide text-ash-100">Police Dispatch &amp; Convoy Correlation</h1>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">
            Nearest-jurisdiction auto-notify on every alert, plus multi-vehicle pattern detection
          </p>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-[11px] ${live ? "text-forest-400" : "text-ash-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse-soft bg-forest-400" : "bg-ash-700"}`} />
          {live ? "LIVE BACKEND CONNECTED" : "BACKEND OFFLINE · start the FastAPI server to see live data"}
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-2 font-mono text-[11px] tracking-wider text-ash-500">CONVOY SIGNATURES</div>
        {convoys.length === 0 && (
          <div className="border border-line/60 bg-panel/30 px-4 py-3 font-mono text-[11px] text-ash-500">
            No correlated multi-vehicle patterns right now.
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {convoys.map((c, i) => (
            <motion.div
              key={c.polygon_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="border border-line/70 bg-panel/40 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-gold-400">{c.polygon_id}</div>
                  <div className="text-sm text-ash-100">{c.vehicles_involved.join(", ")}</div>
                </div>
                <span
                  className="rounded-sm px-2 py-0.5 font-mono text-[10px] tracking-wider"
                  style={{ color: riskColor(c.rating as RiskLevel), border: `1px solid ${riskColor(c.rating as RiskLevel)}66` }}
                >
                  {c.convoy_score}/100
                </span>
              </div>
              <ul className="mt-3 space-y-1 font-mono text-[10px] text-ash-400">
                {c.evidence.map((e: string, idx: number) => (
                  <li key={idx}>• {e}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 font-mono text-[11px] tracking-wider text-ash-500">DISPATCH LOG</div>
        {dispatches.length === 0 && (
          <div className="border border-line/60 bg-panel/30 px-4 py-3 font-mono text-[11px] text-ash-500">
            No alerts dispatched yet — trigger "Run Demo Incident Scenario" on Overview, or wait for the next
            automatic satellite watch.
          </div>
        )}
        <div className="space-y-2">
          {dispatches.map((d) => (
            <div key={d.alert_id} className="border border-line/60 bg-panel/30 px-3 py-2">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-ash-300">
                  {d.alert_id} · {d.kind} · {d.rating}
                </span>
                <span className="text-ash-600">{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1 font-mono text-[10px] text-signal-400">
                🚓 Notified: {d.notified_stations.map((s: any) => `${s.name} (${s.distance_km} km)`).join(", ")}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 font-mono text-[11px] tracking-wider text-ash-500">
          REGISTERED STATIONS ({stations.length})
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {stations.map((s) => (
            <div key={s.station_id} className="border border-line/50 bg-panel/20 px-3 py-2 font-mono text-[10px] text-ash-400">
              <div className="text-ash-200">{s.name}</div>
              <div>{s.zone_id}</div>
              <div className="text-ash-600">{s.phone}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
