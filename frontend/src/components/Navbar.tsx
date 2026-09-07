import React from 'react';
import { 
  TreePine, ShieldAlert, Activity, Satellite, Layers, 
  Truck, Route, FileCheck, AlertTriangle, Settings, Eye, Play
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDemo: () => void;
  onOpenSettings: () => void;
  liveStatus: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDemo,
  onOpenSettings,
  liveStatus
}) => {
  const tabs = [
    { id: 'dashboard', label: 'COMMAND CENTER', icon: Activity },
    { id: 'forests', label: 'FOREST MONITOR', icon: TreePine },
    { id: 'satellite', label: 'SATELLITE INTEL', icon: Satellite },
    { id: 'changes', label: 'DISTURBANCES', icon: Layers },
    { id: '3d-forest', label: '3D TACTICAL TERRAIN', icon: Eye },
    { id: 'vehicles', label: 'VEHICLE TRACKING', icon: Truck },
    { id: 'routes', label: 'CORRIDORS', icon: Route },
    { id: 'permits', label: 'PERMITS', icon: FileCheck },
    { id: 'incidents', label: 'INCIDENT LOG', icon: ShieldAlert },
    { id: 'risk', label: 'RISK ENGINE', icon: AlertTriangle },
  ];

  return (
    <header className="pushpa-panel sticky top-0 z-50 border-b border-[#8E2B18]/40 px-4 py-2.5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Cinematic Title & Operational State */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#8E2B18] to-[#2B1C14] border border-[#D99A4A]/40 shadow-lg shadow-[#8E2B18]/30">
            <TreePine className="h-5 w-5 text-[#D99A4A]" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#D52B1E] animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-title text-xl font-black tracking-widest text-[#F1E7D5] drop-shadow-[0_2px_8px_rgba(142,43,24,0.6)]">
                PUSHPA
              </h1>
              <span className="flex items-center space-x-1.5 rounded-md bg-[#1C1510] px-2 py-0.5 text-[11px] font-tactical font-bold text-[#D99A4A] border border-[#8E2B18]/50">
                <span className={`h-1.5 w-1.5 rounded-full ${liveStatus ? 'bg-[#718C48] animate-pulse' : 'bg-[#D52B1E]'}`}></span>
                <span>{liveStatus ? 'LIVE OPERATION' : 'OFFLINE'}</span>
              </span>
            </div>
            <p className="text-[10px] uppercase font-tactical tracking-[0.18em] text-[#A99A87]">
              RED SANDALWOOD FOREST INTELLIGENCE & ANTI-SMUGGLING
            </p>
          </div>
        </div>

        {/* Tactical Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto rounded-xl bg-[#0B0907]/90 p-1 border border-[#4A3022]/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-tactical tracking-wider uppercase font-bold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-[#8E2B18] to-[#5C160F] text-[#F1E7D5] border border-[#D99A4A]/50 shadow-md shadow-[#8E2B18]/40'
                    : 'text-[#A99A87] hover:bg-[#1C1510] hover:text-[#F1E7D5]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#D99A4A]' : 'text-[#736758]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls (Demo Scenario & Tactical Settings) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenDemo}
            className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-[#B65324] to-[#8E2B18] px-3 py-1.5 text-xs font-tactical tracking-wider font-bold text-[#F1E7D5] border border-[#D99A4A]/60 shadow-md shadow-[#B65324]/30 hover:brightness-110 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-[#F1E7D5]" />
            <span>DEMO CASE</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14100C] border border-[#4A3022] text-[#A99A87] hover:text-[#F1E7D5] hover:border-[#D99A4A] transition-all"
            title="System Configuration"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
