import type { Alert } from '../types';
import { AlertTriangle, ChevronRight, MapPin, Truck, Clock } from 'lucide-react';

interface AlertsListProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts, onSelectAlert }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-800 animate-pulse">🔴 CRITICAL</span>;
      case 'VERY HIGH':
        return <span className="rounded bg-orange-950 px-2 py-0.5 text-[10px] font-black text-orange-400 border border-orange-800">🟠 VERY HIGH</span>;
      case 'HIGH':
        return <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-800">🟡 HIGH</span>;
      case 'MODERATE':
        return <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">🟢 MODERATE</span>;
      default:
        return <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">⚪ LOW</span>;
    }
  };

  return (
    <div className="gis-glass rounded-xl p-3.5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">RECENT INVESTIGATION ALERTS</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
          {alerts.length} ALERTS
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[380px]">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            onClick={() => onSelectAlert(alt)}
            className="group cursor-pointer rounded-xl bg-slate-900/80 p-3 border border-slate-800 hover:border-red-600/50 hover:bg-slate-850 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(alt.severity)}
                  <span className="text-[10px] font-mono text-slate-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {alt.timestamp}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-red-400 transition-colors">
                  {alt.title}
                </h3>
              </div>

              <div className="flex items-center space-x-1 text-right">
                <div className="text-right">
                  <span className="text-xs font-black text-red-400 block">{alt.risk_score}/100</span>
                  <span className="text-[9px] uppercase font-semibold text-slate-500">RISK SCORE</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="flex items-center text-emerald-400 font-medium">
                <MapPin className="h-3 w-3 mr-1" />
                {alt.forest_name}
              </span>

              {alt.vehicle_id && (
                <span className="flex items-center text-amber-400 font-medium">
                  <Truck className="h-3 w-3 mr-1" />
                  TN01AB1234
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
