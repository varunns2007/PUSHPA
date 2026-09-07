import React, { useEffect, useState } from 'react';
import {
  Trees, ShieldAlert, Activity, Satellite, Layers,
  Truck, Route, FileCheck, AlertTriangle, Settings, Play, BarChart3
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
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: 'Asia/Kolkata'
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tabs = [
    { id: 'dashboard',    label: 'Dashboard',        icon: Activity },
    { id: 'forests',      label: 'Forests',           icon: Trees },
    { id: 'satellite',    label: 'Satellite',         icon: Satellite },
    { id: 'changes',      label: 'Change Detection',  icon: Layers },
    { id: 'heatmap-3d',   label: '3D Heatmap',        icon: BarChart3 },
    { id: 'vehicles',     label: 'Vehicles',          icon: Truck },
    { id: 'routes',       label: 'Routes',            icon: Route },
    { id: 'permits',      label: 'Permits',           icon: FileCheck },
    { id: 'incidents',    label: 'Incidents',         icon: ShieldAlert },
    { id: 'risk',         label: 'Risk Engine',       icon: AlertTriangle },
  ];

  return (
    <header className="gis-glass sticky top-0 z-50 border-b border-emerald-900/30 shadow-2xl hud-scanline">
      {/* Top bar — brand + time + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2.5 pb-2">
        {/* Brand */}
        <div className={`flex items-center space-x-3 ${mounted ? 'animate-fade-slide-up' : 'opacity-0'}`}>
          {/* Logo with radar sweep */}
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/30">
              <Trees className="h-6 w-6 text-slate-950 font-bold" />
            </div>
            {/* Radar ring */}
            <div className="absolute inset-0 radar-sweep opacity-60" style={{ borderRadius: '12px' }} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-orbitron text-xl font-black tracking-widest text-emerald-400 text-glow-green">
                PUSHPA
              </h1>
              <span className="flex items-center space-x-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-700/40">
                <span className={`h-2 w-2 rounded-full ${liveStatus ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="font-orbitron text-[9px] tracking-widest">{liveStatus ? 'LIVE' : 'OFFLINE'}</span>
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
              Predictive Unified System for Forest Protection &amp; Anti-Smuggling
            </p>
          </div>
        </div>

        {/* Live clock + Controls */}
        <div className={`flex items-center space-x-3 ${mounted ? 'animate-fade-slide-up delay-200' : 'opacity-0'}`}>
          {/* IST clock */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-mono-hud text-sm font-black text-emerald-400 text-glow-green tracking-widest">{time}</span>
            <span className="text-[9px] uppercase text-slate-600 tracking-widest">IST · India</span>
          </div>

          {/* Demo button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 py-2 text-[10px] font-black tracking-widest text-white shadow-lg shadow-red-900/50 transition-all hover:scale-105 hover:brightness-110 active:scale-95 animate-glow-red font-orbitron"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>DEMO</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-900/50 transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="px-3 pb-2">
        <nav className={`flex items-center space-x-0.5 overflow-x-auto rounded-xl bg-slate-950/80 p-1 border border-slate-800/80 ${mounted ? 'animate-fade-slide-up delay-100' : 'opacity-0'}`}>
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all duration-200 whitespace-nowrap group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-900/60 font-orbitron tracking-wider'
                    : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-200'
                } ${tab.id === 'heatmap-3d' && !active ? 'border border-amber-900/30 text-amber-500' : ''}`}
              >
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${active ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400 group-hover:scale-110'} ${tab.id === 'heatmap-3d' && !active ? 'text-amber-500' : ''}`} />
                <span>{tab.label}</span>
                {tab.id === 'heatmap-3d' && !active && (
                  <span className="ml-1 rounded bg-amber-500/20 px-1 text-[8px] text-amber-400 font-black border border-amber-700/40">NEW</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
