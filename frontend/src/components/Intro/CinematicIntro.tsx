import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LETTERS = ["P", "U", "S", "H", "P", "A"];

interface CinematicIntroProps {
  onComplete: () => void;
}

// Lightweight canvas particle field: floating dust + drifting embers.
function ParticleField({ phase }: { phase: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    resize();
    window.addEventListener("resize", resize);

    const count = 90;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.25 - 0.05,
      gold: Math.random() > 0.6,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const targetAlpha = Math.min(1, phase / 2);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = window.innerHeight + 10;
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(201,162,75,${p.alpha * targetAlpha})`
          : `rgba(180,190,180,${p.alpha * targetAlpha * 0.6})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [phase]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState(0);
  const [skippable, setSkippable] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 900), // ambience + particles
      setTimeout(() => setPhase(2), 2200), // silhouettes
      setTimeout(() => setPhase(3), 4200), // red sweep
      setTimeout(() => setPhase(4), 5300), // gold particles converge
      setTimeout(() => setPhase(5), 6200), // PUSHPA letters
      setTimeout(() => setPhase(6), 8300), // subtitle
      setTimeout(() => setPhase(7), 10300), // scanline sweep
      setTimeout(() => finish(), 12200),
      setTimeout(() => setSkippable(true), 1400),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    setExiting(true);
    setTimeout(onComplete, 900);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden bg-void"
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.9, ease: [0.6, 0, 0.2, 1] }}
        >
          {/* base gradient / soil texture */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 120%, #1a1410 0%, #07090a 55%, #050605 100%)",
            }}
          />
          <div className="absolute inset-0 bg-noise" />

          {/* tree silhouettes */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[70%]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 40 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          >
            <TreeSilhouettes />
          </motion.div>

          {/* particles */}
          <ParticleField phase={phase} />

          {/* red atmospheric sweep */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 3 ? 0.5 : phase > 3 ? 0.15 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            style={{
              background:
                "linear-gradient(100deg, transparent 20%, rgba(154,68,51,0.55) 48%, transparent 75%)",
            }}
          />

          {/* vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 220px 80px rgba(0,0,0,0.85)",
            }}
          />

          {/* title block */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center">
            <div className="flex items-baseline gap-1 md:gap-2">
              {LETTERS.map((letter, i) => (
                <motion.span
                  key={i}
                  className="font-display text-glow-gold text-[15vw] leading-none tracking-tight text-ash-100 md:text-[9vw]"
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={
                    phase >= 5
                      ? { opacity: 1, y: 0, filter: "blur(0px)" }
                      : { opacity: 0, y: 24, filter: "blur(8px)" }
                  }
                  transition={{ duration: 0.55, delay: i * 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    color: i === 5 ? "var(--color-gold-400)" : undefined,
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.div
              className="mt-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.5em] text-ash-300 md:text-sm"
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={
                phase >= 6
                  ? { opacity: 1, letterSpacing: "0.5em" }
                  : { opacity: 0, letterSpacing: "0.2em" }
              }
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <span className="h-px w-6 bg-gold-500/60 md:w-10" />
              FOREST INTELLIGENCE SYSTEM
              <span className="h-px w-6 bg-gold-500/60 md:w-10" />
            </motion.div>
          </div>

          {/* scanline sweep transition */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-forest-400 to-transparent shadow-[0_0_30px_6px_rgba(89,160,114,0.6)]"
            initial={{ top: "-5%" }}
            animate={{ top: phase >= 7 ? "105%" : "-5%" }}
            transition={{ duration: 1.1, ease: [0.7, 0, 0.3, 1] }}
          />

          {skippable && (
            <button
              data-cursor-hover
              onClick={finish}
              className="absolute bottom-6 right-6 z-30 font-mono text-[10px] tracking-[0.2em] text-ash-500 transition-colors hover:text-gold-400"
            >
              SKIP INTRO →
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TreeSilhouettes() {
  // Procedural layered tree-line silhouettes, purely decorative SVG shapes.
  return (
    <svg viewBox="0 0 1440 500" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07090a" stopOpacity="0" />
          <stop offset="100%" stopColor="#07090a" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g fill="#0b1512" opacity="0.9">
        <path d="M0,500 L0,300 L60,220 L100,270 L150,180 L210,260 L260,190 L320,300 L380,230 L430,300 L500,210 L560,290 L620,240 L680,300 L740,200 L800,280 L860,220 L920,300 L980,230 L1040,300 L1100,210 L1160,280 L1220,220 L1280,300 L1340,240 L1400,300 L1440,260 L1440,500 Z" />
      </g>
      <g fill="#0e1e17" opacity="0.85">
        <path d="M0,500 L0,360 L80,300 L140,350 L190,280 L250,340 L310,270 L370,350 L430,290 L490,360 L560,270 L620,350 L690,300 L750,360 L820,280 L880,350 L950,300 L1010,360 L1080,290 L1140,350 L1210,300 L1270,360 L1330,300 L1440,350 L1440,500 Z" />
      </g>
      <rect x="0" y="0" width="1440" height="500" fill="url(#fade)" />
    </svg>
  );
}
