import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TabBar from "../components/Layout/TabBar";
import MultiAgentInterdictionPage from "./MultiAgentInterdictionPage";
import Hotspots from "./Hotspots";
import RiskAnalyticsPage from "./RiskAnalyticsPage";
import VehicleMonitor from "./VehicleMonitor";
import TimberPermitsPage from "./TimberPermitsPage";
import HistoricalIncidentsPage from "./HistoricalIncidentsPage";
import PoliceDispatch from "./PoliceDispatch";

const TABS = [
  { id: "agents", label: "🤖 Multi-Agent Interdiction" },
  { id: "hotspots", label: "Hotspots" },
  { id: "risk", label: "Risk Score" },
  { id: "vehicles", label: "Vehicles" },
  { id: "police", label: "Police Dispatch" },
  { id: "permits", label: "Permits" },
  { id: "incidents", label: "Past Incidents" },
];

export default function ThreatIntel() {
  const [tab, setTab] = useState("agents");

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
            {tab === "agents" && <MultiAgentInterdictionPage />}
            {tab === "hotspots" && <Hotspots />}
            {tab === "risk" && <RiskAnalyticsPage />}
            {tab === "vehicles" && <VehicleMonitor />}
            {tab === "police" && <PoliceDispatch />}
            {tab === "permits" && <TimberPermitsPage />}
            {tab === "incidents" && <HistoricalIncidentsPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

