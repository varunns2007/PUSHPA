import React from 'react';
import { TreePine, AlertTriangle, Truck, Layers } from 'lucide-react';
import type { ForestArea, ChangePolygon, Vehicle, Alert } from '../types';

interface StatsOverviewProps {
  forests: ForestArea[];
  changePolygons: ChangePolygon[];
  vehicles: Vehicle[];
  alerts: Alert[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  forests,
  changePolygons,
  vehicles,
  alerts,
}) => {
  const totalMonitoredHa = forests.reduce((acc, f) => acc + f.total_area_ha, 0);
  const activeLossHa = changePolygons.reduce((acc, p) => acc + p.area_ha, 0);
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'VERY HIGH');
  const activeVehicles = vehicles.length;

  const cards = [
    {
      label: 'MONITORED FOREST BIOSPHERE',
      value: `${(totalMonitoredHa / 1000).toFixed(1)}k`,
      unit: 'HECTARES',
      sub: `${forests.length} Active Reserve Zones`,
      icon: TreePine,
      accent: '#718C48',
      bgGlow: 'from-[#121A11] to-[#14100C]',
      border: 'border-[#718C48]/30',
    },
    {
      label: 'EXTRACTED DISTURBANCE AREA',
      value: `${activeLossHa.toFixed(2)}`,
      unit: 'HA LOSS',
      sub: `${changePolygons.length} Active Spatial Polygons`,
      icon: Layers,
      accent: '#D99A4A',
      bgGlow: 'from-[#2B1C14] to-[#14100C]',
      border: 'border-[#D99A4A]/30',
    },
    {
      label: 'TACTICAL TIMBER VEHICLES',
      value: activeVehicles.toString(),
      unit: 'LIVE UNITS',
      sub: 'Telemetry Tracking Corridor',
      icon: Truck,
      accent: '#B65324',
      bgGlow: 'from-[#1C1510] to-[#14100C]',
      border: 'border-[#B65324]/30',
    },
    {
      label: 'CRITICAL INVESTIGATION ALERTS',
      value: criticalAlerts.length.toString(),
      unit: 'PRIORITY',
      sub: 'Multi-Source Correlated Cases',
      icon: AlertTriangle,
      accent: '#D52B1E',
      bgGlow: 'from-[#5C160F]/30 to-[#14100C]',
      border: 'border-[#D52B1E]/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`pushpa-panel rounded-xl p-3.5 border ${c.border} bg-gradient-to-b ${c.bgGlow} shadow-lg relative overflow-hidden group pushpa-card-interactive`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-tactical font-bold tracking-widest text-[#A99A87] uppercase">
                {c.label}
              </span>
              <Icon className="h-4 w-4" style={{ color: c.accent }} />
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="font-title text-2xl sm:text-3xl font-black tracking-tight text-[#F1E7D5]">
                {c.value}
              </span>
              <span className="text-[11px] font-tactical font-bold text-[#D99A4A] tracking-wider uppercase">
                {c.unit}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] text-[#736758] font-mono">
              <span>{c.sub}</span>
            </div>

            <div 
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70"
              style={{ backgroundColor: c.accent }}
            />
          </div>
        );
      })}
    </div>
  );
};
