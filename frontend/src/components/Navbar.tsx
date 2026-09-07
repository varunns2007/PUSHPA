import React from 'react';
import { 
  Trees, ShieldAlert, Activity, Satellite, Layers, 
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
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'forests', label: 'Forest Monitoring', icon: Trees },
    { id: 'satellite', label: 'Satellite Analysis', icon: Satellite },
    { id: 'changes', label: 'Change Detection', icon: Layers },
    { id: '3d-forest', label: '3D Forest View', icon: Eye },
    { id: 'vehicles', label: 'Vehicle Intelligence', icon: Truck },
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'permits', label: 'Timber Permits', icon: FileCheck },
    { id: 'incidents', label: 'Historical Incidents', icon: ShieldAlert },
    { id: 'risk', label: 'Risk Engine', icon: AlertTriangle },
  ];

  return (
    <header className="gis-glass sticky top-0 z-50 border-b border-emerald-900/40 px-4 py-2.5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & System Identifier */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20">
            <Trees className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-wider text-emerald-400">PUSHPA</h1>
              <span className="flex items-center space-x-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-700/50">
                <span className={`h-2 w-2 rounded-full ${liveStatus ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                <span>{liveStatus ? 'LIVE MONITORING' : 'OFFLINE'}</span>
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              Predictive Unified System for Forest Protection & Anti-Smuggling
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/50 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenDemo}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 py-2 text-xs font-black tracking-wide text-white shadow-lg shadow-red-900/50 transition-all hover:scale-105 hover:brightness-110 active:scale-95 animate-pulse"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>DEMO INCIDENT</span>
          </button>
          
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
            title="System Settings & Google Maps Key"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
