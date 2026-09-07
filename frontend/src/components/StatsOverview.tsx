import React from 'react';
import { Trees, AlertCircle, ShieldAlert, Truck, FileX, Flame } from 'lucide-react';

interface StatsOverviewProps {
  forestsCount: number;
  changesCount: number;
  criticalAlertsCount: number;
  vehiclesCount: number;
  unpermittedCount: number;
  avgRisk: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  forestsCount,
  changesCount,
  criticalAlertsCount,
  vehiclesCount,
  unpermittedCount,
  avgRisk
}) => {
  const cards = [
    { title: 'Monitored Forest Zones', value: forestsCount, unit: 'Zones', icon: Trees, color: 'emerald', detail: 'Copernicus Sentinel-2 AOIs' },
    { title: 'Forest Change Events', value: changesCount, unit: 'Events', icon: AlertCircle, color: 'amber', detail: 'NDVI vegetation drops' },
    { title: 'Critical Investigation Alerts', value: criticalAlertsCount, unit: 'Alerts', icon: ShieldAlert, color: 'red', detail: 'High priority cases' },
    { title: 'Tracked Timber Vehicles', value: vehiclesCount, unit: 'Vehicles', icon: Truck, color: 'cyan', detail: 'GPS telemetry feeds' },
    { title: 'Permit Mismatches', value: unpermittedCount, unit: 'Vehicles', icon: FileX, color: 'rose', detail: 'Missing / expired permits' },
    { title: 'Avg Investigation Risk', value: `${avgRisk}/100`, unit: 'Index', icon: Flame, color: 'orange', detail: 'Geospatial AI Score' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="gis-glass-card group relative overflow-hidden rounded-xl p-3.5 transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:shadow-emerald-950/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">{card.title}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-${card.color}-500/10 text-${card.color}-400 border border-${card.color}-500/20`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-slate-100">{card.value}</span>
              <span className="text-xs font-semibold text-slate-500">{card.unit}</span>
            </div>

            <p className="mt-1 text-[10px] text-slate-400 truncate">{card.detail}</p>
          </div>
        );
      })}
    </div>
  );
};
