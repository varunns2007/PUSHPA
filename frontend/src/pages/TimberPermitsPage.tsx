import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackendBadge from "../components/Backend/BackendBadge";
import { listPermits } from "../api/client";
import { PERMITS_DEMO, type PermitRecord } from "../data/mockData";

const STATUS_COLOR: Record<string, string> = {
  VALID: "var(--color-forest-400)",
  UNPERMITTED: "var(--color-earth-500)",
  EXPIRED: "var(--color-earth-400)",
  ROUTE_MISMATCH: "var(--color-gold-500)",
  SPECIES_MISMATCH: "var(--color-gold-500)",
  OVERWEIGHT: "var(--color-gold-500)",
};

export default function TimberPermitsPage() {
  const [permits, setPermits] = useState<PermitRecord[]>(PERMITS_DEMO);

  useEffect(() => {
    listPermits().then((res) => {
      if (res.ok) setPermits(res.data.permits);
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg tracking-wide text-ash-100">Timber Permit Registry</h1>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">Digital transit permit verification</p>
        </div>
        <BackendBadge />
      </div>

      <div className="overflow-hidden border border-line/70">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="border-b border-line/70 bg-panel/60 text-ash-500">
              <th className="px-3 py-2 font-normal">VEHICLE</th>
              <th className="px-3 py-2 font-normal">PERMIT ID</th>
              <th className="px-3 py-2 font-normal">HOLDER</th>
              <th className="px-3 py-2 font-normal">SPECIES</th>
              <th className="px-3 py-2 font-normal">EXPIRY</th>
              <th className="px-3 py-2 font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {permits.map((p, i) => (
              <motion.tr
                key={p.vehicle_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-line/50 last:border-0 hover:bg-panel/40"
              >
                <td className="px-3 py-2 text-ash-100">#{p.vehicle_id}</td>
                <td className="px-3 py-2 text-ash-300">{p.permit_id ?? "—"}</td>
                <td className="px-3 py-2 text-ash-300">{p.holder ?? "—"}</td>
                <td className="px-3 py-2 text-ash-300">{p.authorized_species ?? "—"}</td>
                <td className="px-3 py-2 text-ash-300">{p.expiry ?? "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[10px] tracking-wider"
                    style={{ color: STATUS_COLOR[p.status] ?? "var(--color-ash-300)", border: `1px solid ${STATUS_COLOR[p.status] ?? "var(--color-line)"}66` }}
                  >
                    {p.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-ash-500">
        Permit checks validate expiry date, species authorization, approved transit corridor, and declared payload
        against the digital timber registry. This is a demonstration registry with a handful of seeded vehicles.
      </p>
    </div>
  );
}
