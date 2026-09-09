import { useBackendStatus } from "../../hooks/useBackendStatus";

export default function BackendBadge() {
  const { online, checked } = useBackendStatus();
  if (!checked) return null;
  return (
    <div
      className={`flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] tracking-wider ${
        online ? "border-forest-500/50 text-forest-400" : "border-line/70 text-ash-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "animate-pulse-soft bg-forest-400" : "bg-ash-700"}`} />
      {online ? "LIVE BACKEND CONNECTED" : "DEMO DATA · BACKEND OFFLINE"}
    </div>
  );
}
