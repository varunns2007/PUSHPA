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

  useEffect(() => {
    setVisibleCount(0);
    alerts.forEach((_, i) => {
      setTimeout(() => setVisibleCount(prev => Math.max(prev, i + 1)), i * 90);
    });
  }, [alerts]);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          badge: '🔴 CRITICAL', animate: true,
          badgeStyle: { background: 'rgba(127,29,29,0.7)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.8)' },
          cardStyle: { borderColor: 'rgba(185,28,28,0.4)' },
          hoverStyle: { borderColor: 'rgba(185,28,28,0.8)', boxShadow: '0 0 20px rgba(185,28,28,0.15)' }
        };
      case 'VERY HIGH':
        return {
          badge: '🟠 VERY HIGH', animate: false,
          badgeStyle: { background: 'rgba(120,53,15,0.7)', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.6)' },
          cardStyle: { borderColor: 'rgba(217,119,6,0.25)' },
          hoverStyle: { borderColor: 'rgba(234,88,12,0.5)' }
        };
      case 'HIGH':
        return {
          badge: '🟡 HIGH', animate: false,
          badgeStyle: { background: 'rgba(92,50,15,0.7)', color: '#FDE68A', border: '1px solid rgba(217,119,6,0.4)' },
          cardStyle: { borderColor: 'rgba(217,119,6,0.2)' },
          hoverStyle: { borderColor: 'rgba(217,119,6,0.4)' }
        };
      default:
        return {
          badge: '⚪ MODERATE', animate: false,
          badgeStyle: { background: 'rgba(28,8,0,0.7)', color: '#9CA3AF', border: '1px solid rgba(185,28,28,0.15)' },
          cardStyle: { borderColor: 'rgba(185,28,28,0.1)' },
          hoverStyle: { borderColor: 'rgba(185,28,28,0.25)' }
        };
    }
  };

  return (
    <div
      className="rounded-xl flex flex-col h-full animate-fade-slide-up delay-300"
      style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-3"
        style={{ borderBottom: '1px solid rgba(185,28,28,0.2)' }}
      >
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 animate-pulse" style={{ color: '#DC2626' }} />
          <h2 className="font-orbitron text-[10px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
            INVESTIGATION ALERTS
          </h2>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold font-orbitron"
          style={{ background: 'rgba(127,29,29,0.5)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.5)' }}
        >
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
              className={`group cursor-pointer rounded-xl p-3 transition-all duration-250 ${isVisible ? 'animate-alert-slide' : 'opacity-0'}`}
              style={{
                background: 'rgba(28,8,0,0.75)',
                border: `1px solid`,
                borderColor: cfg.cardStyle.borderColor,
                animationDelay: `${idx * 70}ms`,
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLDivElement).style, cfg.hoverStyle)}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLDivElement).style, { borderColor: cfg.cardStyle.borderColor, boxShadow: 'none' })}
            >
              {/* Row 1 */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`rounded px-2 py-0.5 text-[9px] font-black ${cfg.animate ? 'animate-pulse' : ''}`}
                  style={cfg.badgeStyle}
                >
                  {cfg.badge}
                </span>
                <span className="text-[9px] font-mono-hud flex items-center" style={{ color: 'rgba(217,119,6,0.5)' }}>
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {alt.timestamp}
                </span>
              </div>

              {/* Row 2 */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[11px] font-bold leading-snug flex-1 transition-colors"
                  style={{ color: '#F5E6DC' }}
                  onMouseEnter={e => (e.currentTarget as HTMLHeadingElement).style.color = '#FCA5A5'}
                  onMouseLeave={e => (e.currentTarget as HTMLHeadingElement).style.color = '#F5E6DC'}
                >
                  {alt.title}
                </h3>
                <div className="text-right flex-shrink-0 flex items-center gap-1">
                  <div>
                    <span className="font-orbitron text-sm font-black block" style={{ color: '#DC2626' }}>{alt.risk_score}</span>
                    <span className="text-[8px] uppercase block leading-none" style={{ color: 'rgba(217,119,6,0.4)' }}>RISK</span>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-all" style={{ color: 'rgba(185,28,28,0.4)' }} />
                </div>
              </div>

              {/* Row 3 */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 pt-1.5" style={{ borderTop: '1px solid rgba(185,28,28,0.12)' }}>
                <span className="flex items-center text-[10px] font-medium" style={{ color: '#EA580C' }}>
                  <MapPin className="h-2.5 w-2.5 mr-0.5" />
                  {alt.forest_name}
                </span>
                {alt.vehicle_id && (
                  <span className="flex items-center text-[10px] font-medium" style={{ color: '#D97706' }}>
                    <Truck className="h-2.5 w-2.5 mr-0.5" />
                    TN01AB1234
                  </span>
                )}
                {isDispatched && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-bold rounded px-1.5 py-0.5"
                    style={{ background: 'rgba(30,64,175,0.3)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.4)' }}>
                    <Shield className="h-2.5 w-2.5" />
                    🚔 DISPATCHED
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 space-y-2" style={{ color: 'rgba(185,28,28,0.3)' }}>
            <AlertTriangle className="h-8 w-8 opacity-40" />
            <span className="text-xs">No active alerts</span>
          </div>
        )}
      </div>
    </div>
  );
};
