import React from 'react';
import { Clock, ShieldAlert, ArrowRight, Flame, MapPin } from 'lucide-react';
import type { Alert } from '../types';

interface AlertsListProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts, onSelectAlert }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#5C160F] text-[#F1E7D5] border-[#D52B1E] shadow-red-950/60';
      case 'VERY HIGH':
        return 'bg-[#8E2B18]/80 text-[#F1E7D5] border-[#E0541E]';
      case 'HIGH':
        return 'bg-[#B65324]/60 text-[#F1E7D5] border-[#D99A4A]';
      default:
        return 'bg-[#2B1C14] text-[#D99A4A] border-[#9A8065]/40';
    }
  };

  return (
    <div className="pushpa-panel flex h-full flex-col rounded-xl border border-[#4A3022]/50 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#4A3022]/60 bg-[#14100C]/90 px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8E2B18]/30 border border-[#D52B1E]/40 text-[#D52B1E]">
            <Flame className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="font-title text-xs font-black tracking-widest text-[#F1E7D5] uppercase">
              LIVE TACTICAL ALERTS
            </h2>
            <p className="text-[10px] font-tactical tracking-wider text-[#A99A87]">
              DECISION-SUPPORT INTELLIGENCE FEED
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#1C1510] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#D99A4A] border border-[#8E2B18]">
          {alerts.length} ACTIVE
        </span>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {alerts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-[#736758]">
            <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs font-tactical uppercase tracking-wider">ALL FOREST SECTORS CLEAR</p>
            <p className="text-[10px] text-[#A99A87]">No high-priority disturbances detected</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'VERY HIGH';
            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`group relative rounded-xl p-3 border transition-all duration-200 cursor-pointer pushpa-card pushpa-card-interactive ${
                  isCritical
                    ? 'border-[#8E2B18]/70 hover:border-[#D52B1E] bg-gradient-to-r from-[#1C1510] to-[#14100C]'
                    : 'border-[#4A3022]/50 hover:border-[#D99A4A]'
                }`}
              >
                {/* Top Row: Severity & Timestamp */}
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-tactical font-black tracking-wider border shadow-sm ${getSeverityBadge(
                      alert.severity
                    )}`}
                  >
                    ● {alert.severity}
                  </span>

                  <div className="flex items-center space-x-2 text-[10px] font-mono text-[#A99A87]">
                    <Clock className="h-3 w-3 text-[#D99A4A]" />
                    <span>{alert.timestamp}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-2 text-xs font-bold text-[#F1E7D5] group-hover:text-[#D99A4A] transition-colors line-clamp-2">
                  {alert.title}
                </h3>

                {/* Location & Risk Score */}
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 text-[#A99A87] truncate max-w-[170px]">
                    <MapPin className="h-3 w-3 text-[#8E2B18] shrink-0" />
                    <span className="truncate font-tactical">{alert.forest_name}</span>
                  </div>

                  <div className="flex items-center space-x-1 font-mono font-bold">
                    <span className="text-[10px] text-[#736758]">RISK</span>
                    <span className={`text-xs ${isCritical ? 'text-[#D52B1E]' : 'text-[#D99A4A]'}`}>
                      {alert.risk_score}
                    </span>
                    <span className="text-[10px] text-[#736758]">/100</span>
                  </div>
                </div>

                {/* Hover CTA Indicator */}
                <div className="mt-2 pt-2 border-t border-[#4A3022]/40 flex items-center justify-between text-[10px] font-tactical tracking-wider text-[#A99A87] group-hover:text-[#F1E7D5]">
                  <span>INSPECT INVESTIGATION DOSSIER</span>
                  <ArrowRight className="h-3 w-3 text-[#D99A4A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
