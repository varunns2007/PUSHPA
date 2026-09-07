import React, { useEffect, useState } from 'react';
import {
  Trees, ShieldAlert, Activity, Satellite, Layers,
  Truck, Route, FileCheck, AlertTriangle, Settings, Play, BarChart3, Flame
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDemo: () => void;
  onOpenSettings: () => void;
  liveStatus: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, onOpenDemo, onOpenSettings, liveStatus
}) => {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    setMounted(true);
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: 'Asia/Kolkata'
    }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tabs = [
    { id: 'dashboard',  label: 'Dashboard',       icon: Activity },
    { id: 'forests',    label: 'Forests',          icon: Trees },
    { id: 'satellite',  label: 'Satellite',        icon: Satellite },
    { id: 'changes',    label: 'Change Detection', icon: Layers },
    { id: 'heatmap-3d', label: '3D Heatmap',       icon: BarChart3, badge: 'HOT' },
    { id: 'vehicles',   label: 'Vehicles',         icon: Truck },
    { id: 'routes',     label: 'Routes',           icon: Route },
    { id: 'permits',    label: 'Permits',          icon: FileCheck },
    { id: 'incidents',  label: 'Incidents',        icon: ShieldAlert },
    { id: 'risk',       label: 'Risk Engine',      icon: AlertTriangle },
  ];

  return (
    <header
      className="gis-glass sticky top-0 z-50 hud-scanline shadow-2xl"
      style={{ borderBottom: '1px solid rgba(185,28,28,0.3)' }}
    >
      {/* Top strip — brand + clock + actions */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-2 ${mounted ? 'animate-fade-slide-up' : 'opacity-0'}`}>

        {/* Brand */}
        <div className="flex items-center space-x-3">
          {/* Logo with radar sweep */}
          <div className="relative">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg animate-glow-red"
              style={{ background: 'linear-gradient(135deg, #7F1D1D, #B91C1C, #DC2626)' }}
            >
              <Flame className="h-6 w-6 text-orange-200" />
            </div>
            <div className="absolute inset-0 radar-sweep opacity-50" style={{ borderRadius: '12px' }} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1
                className="font-cinzel font-black tracking-[0.15em] text-glow-red"
                style={{
                  fontSize: '1.4rem',
                  background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 40%, #D97706 60%, #EA580C 80%, #DC2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                PUSHPA
              </h1>
              <span
                className="flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                style={{
                  background: 'rgba(127,29,29,0.4)',
                  borderColor: 'rgba(185,28,28,0.5)',
                  color: '#FCA5A5',
                }}
              >
                <span className={`h-2 w-2 rounded-full ${liveStatus ? 'animate-ping' : ''}`}
                  style={{ background: liveStatus ? '#DC2626' : '#D97706' }} />
                <span className="font-orbitron text-[9px] tracking-widest">{liveStatus ? 'LIVE' : 'OFFLINE'}</span>
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Forest Protection &amp; Anti-Smuggling Intelligence System
            </p>
          </div>
        </div>

        {/* Right: clock + controls */}
        <div className={`flex items-center space-x-3 ${mounted ? 'animate-fade-slide-up delay-200' : 'opacity-0'}`}>
          {/* IST clock */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-mono-hud text-sm font-black text-glow-orange tracking-widest" style={{ color: '#EA580C' }}>
              {time}
            </span>
            <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(217,119,6,0.5)' }}>IST · India</span>
          </div>

          {/* Demo button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center space-x-2 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95 font-orbitron animate-glow-red"
            style={{
              background: 'linear-gradient(135deg, #7F1D1D, #991B1B, #B91C1C)',
              border: '1px solid rgba(185,28,28,0.6)',
              boxShadow: '0 4px 24px rgba(185,28,28,0.5)',
            }}
          >
            <Play className="h-3.5 w-3.5 fill-red-200 text-red-200" />
            <span style={{ color: '#FCA5A5' }}>DEMO</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(28,8,0,0.8)',
              border: '1px solid rgba(185,28,28,0.25)',
              color: 'rgba(217,119,6,0.7)',
            }}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="px-3 pb-2.5">
        <nav
          className={`flex items-center space-x-0.5 overflow-x-auto rounded-xl p-1 ${mounted ? 'animate-fade-slide-up delay-100' : 'opacity-0'}`}
          style={{ background: 'rgba(10,3,0,0.85)', border: '1px solid rgba(185,28,28,0.15)' }}
        >
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center space-x-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all duration-200 whitespace-nowrap group"
                style={active ? {
                  animationDelay: `${i * 35}ms`,
                  background: 'linear-gradient(135deg, #7F1D1D, #991B1B)',
                  color: '#FCA5A5',
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.08em',
                  border: '1px solid rgba(185,28,28,0.5)',
                  boxShadow: '0 2px 12px rgba(185,28,28,0.4)',
                } : {
                  animationDelay: `${i * 35}ms`,
                  color: 'rgba(217,119,6,0.6)',
                  border: '1px solid transparent',
                }}
              >
                <Icon
                  className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: active ? '#FCA5A5' : (tab.badge ? '#EA580C' : 'rgba(217,119,6,0.6)') }}
                />
                <span>{tab.label}</span>
                {tab.badge && !active && (
                  <span
                    className="ml-1 rounded px-1 text-[7px] font-black"
                    style={{ background: 'rgba(185,28,28,0.4)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.5)' }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
