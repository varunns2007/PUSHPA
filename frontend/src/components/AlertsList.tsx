import React, { useEffect, useState } from 'react';
import type { Alert } from '../types';
import { AlertTriangle, ChevronRight, MapPin, Truck, Clock, Shield } from 'lucide-react';

interface AlertsListProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  dispatchedAlertIds?: string[];
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts, onSelectAlert, dispatchedAlertIds = [] }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  // Stagger entrance of alert cards
  useEffect(() => {
    setVisibleCount(0);
    alerts.forEach((_, i) => {
      setTimeout(() => setVisibleCount(prev => Math.max(prev, i + 1)), i * 80);
    });
  }, [alerts]);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':  return { badge: '🔴 CRITICAL',  cls: 'bg-red-950 text-red-400 border-red-800 animate-pulse', border: 'border-red-800/30 hover:border-red-500/60', glow: 'hover:shadow-red-950/30' };
      case 'VERY HIGH': return { badge: '🟠 VERY HIGH', cls: 'bg-orange-950 text-orange-400 border-orange-800',       border: 'border-orange-800/20 hover:border-orange-500/50', glow: 'hover:shadow-orange-950/20' };
      case 'HIGH':      return { badge: '🟡 HIGH',      cls: 'bg-amber-950 text-amber-400 border-amber-800',          border: 'border-amber-800/20 hover:border-amber-500/50',  glow: 'hover:shadow-amber-950/20' };
      case 'MODERATE':  return { badge: '🟢 MODERATE',  cls: 'bg-emerald-950 text-emerald-400 border-emerald-800',   border: 'border-emerald-800/20',                          glow: '' };
      default:          return { badge: '⚪ LOW',        cls: 'bg-slate-800 text-slate-300 border-slate-700',          border: 'border-slate-800/20',                            glow: '' };
    }
  };

  return (
    <div className="gis-glass rounded-xl border border-slate-800 flex flex-col h-full animate-fade-slide-up delay-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
          <h2 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-slate-200">
            INVESTIGATION ALERTS
          </h2>
        </div>
        <span className="rounded-full bg-red-950/60 border border-red-900/50 px-2 py-0.5 text-[9px] font-bold text-red-400 font-orbitron">
          {alerts.length}
        </span>
      </div>

      {/* List */}
      <div className="space-y-2 overflow-y-auto flex-1 p-2.5">
        {alerts.map((alt, idx) => {
          const cfg = getSeverityConfig(alt.severity);
          const isDispatched = dispatchedAlertIds.includes(alt.id);
          const isVisible = idx < visibleCount;

          return (
            <div
              key={alt.id}
              onClick={() => onSelectAlert(alt)}
              className={`group cursor-pointer rounded-xl bg-slate-900/70 p-3 border ${cfg.border} hover:bg-slate-900 transition-all duration-250 hover:shadow-lg ${cfg.glow} ${
                isVisible ? 'animate-alert-slide' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              {/* Row 1: severity + time */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`rounded px-2 py-0.5 text-[9px] font-black border ${cfg.cls}`}>
                  {cfg.badge}
                </span>
                <span className="text-[9px] font-mono-hud text-slate-500 flex items-center">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {alt.timestamp}
                </span>
              </div>

              {/* Row 2: title + risk score */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[11px] font-bold text-slate-100 group-hover:text-red-400 transition-colors leading-snug flex-1">
                  {alt.title}
                </h3>
                <div className="text-right flex-shrink-0 flex items-center gap-1">
                  <div>
                    <span className="font-orbitron text-sm font-black text-red-400 block">{alt.risk_score}</span>
                    <span className="text-[8px] uppercase text-slate-600 block leading-none">RISK</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Row 3: location + vehicle + dispatch badge */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 border-t border-slate-800/50 pt-1.5">
                <span className="flex items-center text-[10px] text-emerald-400 font-medium">
                  <MapPin className="h-2.5 w-2.5 mr-0.5" />
                  {alt.forest_name}
                </span>
                {alt.vehicle_id && (
                  <span className="flex items-center text-[10px] text-amber-400 font-medium">
                    <Truck className="h-2.5 w-2.5 mr-0.5" />
                    TN01AB1234
                  </span>
                )}
                {isDispatched && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-950/60 rounded px-1.5 py-0.5 border border-emerald-900/50">
                    <Shield className="h-2.5 w-2.5" />
                    🚔 DISPATCHED
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs space-y-2">
            <AlertTriangle className="h-8 w-8 opacity-30" />
            <span>No active alerts</span>
          </div>
        )}
      </div>
    </div>
  );
};
