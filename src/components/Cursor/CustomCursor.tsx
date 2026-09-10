import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [hovering, setHovering] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches || window.innerWidth < 900) {
      setEnabled(false);
      return;
    }
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement;
      setHovering(!!target.closest("[data-cursor-hover]"));
    };
    const down = (e: MouseEvent) => {
      const id = rippleId.current++;
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[999] rounded-full border border-gold-400/70 mix-blend-difference"
        style={{
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ width: hovering ? 44 : 18, height: hovering ? 44 : 18 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="pointer-events-none fixed z-[998] rounded-full border border-gold-500/60"
            style={{ left: r.x, top: r.y, translateX: "-50%", translateY: "-50%" }}
            initial={{ width: 6, height: 6, opacity: 0.7 }}
            animate={{ width: 60, height: 60, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </>
  );
}
