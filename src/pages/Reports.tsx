import { motion } from "framer-motion";
import { REPORTS } from "../data/mockData";
import { FileText, Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <h1 className="mb-1 font-display text-lg tracking-wide text-ash-100">Reports</h1>
      <p className="mb-5 font-mono text-[11px] text-ash-500">Generated assessments &amp; verification logs</p>

      <div className="space-y-3">
        {REPORTS.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, scaleY: 0.6, transformOrigin: "top" }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
            className="flex items-center justify-between border border-line/70 bg-panel/40 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-line/70 text-gold-500">
                <FileText size={18} strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm text-ash-100">{r.title}</div>
                <div className="font-mono text-[10px] text-ash-500">{r.id} · {r.date} · {r.pages} pages</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="rounded-sm px-2 py-0.5 font-mono text-[9px] tracking-wider"
                style={{
                  color: r.status === "FINAL" ? "var(--color-forest-400)" : "var(--color-gold-500)",
                  border: `1px solid ${r.status === "FINAL" ? "var(--color-forest-400)" : "var(--color-gold-500)"}55`,
                }}
              >
                {r.status}
              </span>
              <button data-cursor-hover className="flex items-center gap-1.5 border border-line/70 px-2.5 py-1.5 font-mono text-[10px] text-ash-300 transition-colors hover:border-gold-500/50 hover:text-gold-400">
                <Download size={13} strokeWidth={1.5} /> EXPORT
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
