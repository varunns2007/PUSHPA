import { useState } from "react";
import HUDFrame from "../components/HUD/HUDFrame";
import { REGION } from "../data/mockData";

export default function Settings({ soundOn, setSoundOn }: { soundOn: boolean; setSoundOn: (v: boolean) => void }) {
  const [demoMode] = useState(true);

  return (
    <div className="h-full overflow-y-auto p-4">
      <h1 className="mb-5 font-display text-lg tracking-wide text-ash-100">Settings</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HUDFrame label="SYSTEM" className="space-y-4 p-4">
          <Toggle label="Sound Effects" description="Ambient forest audio, UI clicks, alerts" value={soundOn} onChange={setSoundOn} />
          <Toggle label="Demo Mode" description="Use simulated satellite &amp; vehicle data" value={demoMode} onChange={() => {}} locked />
        </HUDFrame>

        <HUDFrame label="REGION" className="space-y-3 p-4 font-mono text-[11px]">
          <Row k="Name" v={REGION.name} />
          <Row k="Code" v={REGION.code} />
          <Row k="Area" v={`${REGION.areaKm2} km²`} />
          <Row k="Coordinates" v={`${REGION.centerLat}, ${REGION.centerLng}`} />
        </HUDFrame>

        <HUDFrame label="API CONFIGURATION" className="space-y-3 p-4 font-mono text-[11px] text-ash-500">
          <p>Satellite, mapping, and backend endpoints are read from environment variables and are never exposed in source code.</p>
          <div className="space-y-1.5 pt-2">
            <EnvRow name="VITE_SATELLITE_API_URL" />
            <EnvRow name="VITE_GOOGLE_MAPS_API_KEY" />
            <EnvRow name="VITE_BACKEND_URL" />
          </div>
        </HUDFrame>

        <HUDFrame label="ABOUT" className="space-y-2 p-4 font-mono text-[11px] text-ash-500">
          <p>PUSHPA — Forest Intelligence &amp; Anti-Deforestation System.</p>
          <p>All figures shown across this application are simulated demo data for presentation purposes.</p>
        </HUDFrame>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange, locked }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line/50 pb-3 last:border-0 last:pb-0">
      <div>
        <div className="text-sm text-ash-100">{label}</div>
        <div className="font-mono text-[10px] text-ash-500">{description}</div>
      </div>
      <button
        data-cursor-hover
        disabled={locked}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full border transition-colors ${value ? "border-gold-500/60 bg-gold-500/20" : "border-line bg-panel"} ${locked ? "opacity-50" : ""}`}
      >
        <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ash-100 transition-all ${value ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ash-500">{k}</span>
      <span className="text-ash-100">{v}</span>
    </div>
  );
}

function EnvRow({ name }: { name: string }) {
  return (
    <div className="flex justify-between border border-line/50 px-2 py-1">
      <span>{name}</span>
      <span className="text-ash-700">•••••••</span>
    </div>
  );
}
