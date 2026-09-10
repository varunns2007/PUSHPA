import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runDemoScenario } from "../../api/client";

interface Step {
  step: number;
  title: string;
  detail: string;
  data?: any;
}

export default function DemoScenarioButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [final, setFinal] = useState<{ score: number; rating: string } | null>(null);

  const run = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setSteps([]);
    setRevealed(0);
    setFinal(null);

    const res = await runDemoScenario();
    setLoading(false);
    if (!res.ok) {
      setError("Backend not reachable. Start the FastAPI server in /backend (see README) to run the live 10-step scenario.");
      return;
    }
    setSteps(res.data.steps);
    setFinal({ score: res.data.final_risk_score, rating: res.data.final_rating });

    res.data.steps.forEach((_: Step, i: number) => {
      setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), i * 550);
    });
  };

  return (
    <>
      <button
        data-cursor-hover
        onClick={run}
        className="flex items-center gap-2 border border-earth-500/50 bg-earth-700/10 px-3 py-1.5 font-mono text-[11px] tracking-wider text-earth-400 transition-colors hover:bg-earth-500/10"
      >
        ▶ RUN DEMO INCIDENT SCENARIO
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-void/85 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-[560px] max-w-[92vw] overflow-y-auto border border-line bg-bark/95 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-display text-base tracking-wide text-ash-100">Demo Incident Scenario</div>
                  <div className="font-mono text-[10px] text-ash-500">Nilgiri Biosphere Reserve · Zone A</div>
                </div>
                <button data-cursor-hover onClick={() => setOpen(false)} className="text-ash-500 hover:text-ash-100">✕</button>
              </div>

              {loading && (
                <div className="flex items-center gap-2 font-mono text-xs text-gold-400">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-400" /> RUNNING PIPELINE…
                </div>
              )}

              {error && (
                <div className="border border-earth-500/50 bg-earth-700/10 p-3 font-mono text-[11px] text-earth-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {steps.slice(0, revealed).map((s) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="border border-line/60 bg-panel/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px] text-gold-400">
                      <span className="flex h-4 w-4 items-center justify-center border border-gold-500/50">{s.step}</span>
                      {s.title}
                    </div>
                    <div className="mt-1 pl-6 font-mono text-[11px] text-ash-300">{s.detail}</div>
                  </motion.div>
                ))}
              </div>

              {final && revealed >= steps.length && steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 border border-earth-500/60 bg-earth-700/10 p-4 text-center"
                >
                  <div className="font-mono text-[10px] tracking-[0.2em] text-earth-400">FINAL RISK ASSESSMENT</div>
                  <div className="font-display text-3xl text-earth-400">{final.score}/100 · {final.rating}</div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
