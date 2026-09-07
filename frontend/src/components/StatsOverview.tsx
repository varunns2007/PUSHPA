import React, { useEffect, useState } from 'react';
import { Trees, AlertCircle, ShieldAlert, Truck, FileX, Flame } from 'lucide-react';

interface StatsOverviewProps {
  forestsCount: number;
  changesCount: number;
  criticalAlertsCount: number;
  vehiclesCount: number;
  unpermittedCount: number;
  avgRisk: number;
}

// Animated counter hook
function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

interface StatCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ElementType;
  color: string;
  detail: string;
  delay: number;
  animate?: boolean;
  rawValue: number;
  sparkData: number[];
}

const SPARKLINE_W = 48;
const SPARKLINE_H = 20;

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = SPARKLINE_W / (data.length - 1);
  const points = data.map((v, i) => `${i * w},${SPARKLINE_H - (v / max) * (SPARKLINE_H - 2)}`).join(' ');
  return (
    <svg width={SPARKLINE_W} height={SPARKLINE_H} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) * w}
        cy={SPARKLINE_H - (data[data.length - 1] / max) * (SPARKLINE_H - 2)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

const colorMap: Record<string, { text: string; border: string; bg: string; hex: string }> = {
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10', hex: '#10b981' },
  amber:   { text: 'text-amber-400',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10',   hex: '#f59e0b' },
  red:     { text: 'text-red-400',     border: 'border-red-500/25',     bg: 'bg-red-500/10',     hex: '#ef4444' },
  cyan:    { text: 'text-cyan-400',    border: 'border-cyan-500/25',    bg: 'bg-cyan-500/10',    hex: '#06b6d4' },
  rose:    { text: 'text-rose-400',    border: 'border-rose-500/25',    bg: 'bg-rose-500/10',    hex: '#fb7185' },
  orange:  { text: 'text-orange-400',  border: 'border-orange-500/25',  bg: 'bg-orange-500/10',  hex: '#fb923c' },
};

const StatCard: React.FC<StatCardProps> = ({
  title, value, unit, icon: Icon, color, detail, delay, animate, rawValue, sparkData
}) => {
  const animatedVal = useCounter(animate ? rawValue : 0, 1200 + delay);
  const displayVal = animate
    ? (typeof value === 'string' ? value : animatedVal)
    : value;

  const c = colorMap[color] ?? colorMap.emerald;

  return (
    <div
      className={`gis-glass-card shimmer-card group relative overflow-hidden rounded-2xl p-4 border ${c.border} animate-fade-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient corner glow */}
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${c.bg} blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <span className="text-[10px] font-semibold text-slate-400 leading-snug max-w-[100px]">{title}</span>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text} border ${c.border} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value */}
      <div className="mt-2 flex items-end justify-between relative z-10">
        <div>
          <span className={`font-orbitron text-2xl font-black ${c.text} ${animate ? 'animate-counter-flash' : ''}`}>
            {displayVal}
          </span>
          <span className="ml-1.5 text-[10px] font-semibold text-slate-500">{unit}</span>
        </div>
        <Sparkline data={sparkData} color={c.hex} />
      </div>

      {/* Detail */}
      <p className="mt-1.5 text-[10px] text-slate-500 truncate relative z-10">{detail}</p>

      {/* Bottom glow line */}
      <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  );
};

// Simulated sparkline trends
const SPARKS: Record<string, number[]> = {
  forests:    [5, 5, 6, 6, 7, 7, 7],
  changes:    [2, 4, 3, 6, 8, 9, 12],
  critical:   [1, 2, 1, 3, 4, 5, 4],
  vehicles:   [8, 9, 10, 11, 10, 12, 11],
  unpermit:   [2, 3, 2, 4, 5, 4, 6],
  risk:       [60, 65, 68, 72, 74, 76, 78],
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  forestsCount, changesCount, criticalAlertsCount,
  vehiclesCount, unpermittedCount, avgRisk
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const cards: StatCardProps[] = [
    { title: 'Monitored Forest Zones',       value: forestsCount,        rawValue: forestsCount,        unit: 'Zones',    icon: Trees,      color: 'emerald', detail: 'Copernicus Sentinel-2 AOIs', delay: 0,   animate: mounted, sparkData: SPARKS.forests },
    { title: 'Forest Change Events',          value: changesCount,        rawValue: changesCount,        unit: 'Events',   icon: AlertCircle,color: 'amber',   detail: 'NDVI vegetation drops',      delay: 80,  animate: mounted, sparkData: SPARKS.changes },
    { title: 'Critical Investigation Alerts', value: criticalAlertsCount, rawValue: criticalAlertsCount, unit: 'Alerts',   icon: ShieldAlert,color: 'red',     detail: 'High priority cases',        delay: 160, animate: mounted, sparkData: SPARKS.critical },
    { title: 'Tracked Timber Vehicles',       value: vehiclesCount,       rawValue: vehiclesCount,       unit: 'Vehicles', icon: Truck,      color: 'cyan',    detail: 'GPS telemetry feeds',        delay: 240, animate: mounted, sparkData: SPARKS.vehicles },
    { title: 'Permit Mismatches',             value: unpermittedCount,    rawValue: unpermittedCount,    unit: 'Vehicles', icon: FileX,      color: 'rose',    detail: 'Missing / expired permits',  delay: 320, animate: mounted, sparkData: SPARKS.unpermit },
    { title: 'Avg Investigation Risk',        value: `${avgRisk}/100`,    rawValue: avgRisk,             unit: 'Index',    icon: Flame,      color: 'orange',  detail: 'Geospatial AI Score',        delay: 400, animate: mounted, sparkData: SPARKS.risk },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, idx) => (
        <StatCard key={idx} {...card} />
      ))}
    </div>
  );
};
