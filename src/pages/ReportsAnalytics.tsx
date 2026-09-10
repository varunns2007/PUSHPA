import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TabBar from "../components/Layout/TabBar";
import Analytics from "./Analytics";
import Reports from "./Reports";

const TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "reports", label: "Reports" },
];

export default function ReportsAnalytics() {
  const [tab, setTab] = useState("analytics");

  return (
    <div className="flex h-full flex-col">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {tab === "analytics" && <Analytics />}
            {tab === "reports" && <Reports />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
