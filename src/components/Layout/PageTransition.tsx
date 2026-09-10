import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -14, scale: 1.01, filter: "blur(6px)" }}
      transition={{ duration: 0.55, ease: [0.22, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
