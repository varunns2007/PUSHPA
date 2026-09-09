import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  "SATELLITE DATA",
  "VEGETATION ANALYSIS",
  "DENSITY CALCULATION",
  "CHANGE DETECTION",
  "RISK ANALYSIS",
  "SYSTEM READY",
];

export default function LoadingSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => {
        if (s >= STAGES.length - 1) {
          clearInterval(t);
          setTimeout(onComplete, 450);
          return s;
        }
        return s + 1;
      });
    }, 320);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-void">
      <div className="mb-8 font-display text-sm tracking-[0.4em] text-ash-300">ANALYZING FOREST</div>
      <div className="w-64 space-y-2 font-mono text-[11px]">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-2.5">
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i < stage ? "bg-forest-400" : i === stage ? "bg-gold-400" : "bg-line"
              }`}
            />
            <span className={i <= stage ? "text-ash-100" : "text-ash-700"}>{s}</span>
            <AnimatePresence>
              {i === stage && i < STAGES.length - 1 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto text-gold-500"
                >
                  ···
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
