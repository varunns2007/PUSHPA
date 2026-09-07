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

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 48, H = 20;
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${H - (v / max) * (H - 2)}`).join(' ');
  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) * step}
        cy={H - (data[data.length - 1] / max) * (H - 2)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// Pushpa 3-color theme stat configs
const CARD_CONFIGS = [
  { color: '#EA580C', borderColor: 'rgba(234,88,12,0.25)',  glowColor: 'rgba(234,88,12,0.08)',  spark: [5,5,6,6,7,7,7] },
  { color: '#D97706', borderColor: 'rgba(217,119,6,0.25)',  glowColor: 'rgba(217,119,6,0.08)',  spark: [2,4,3,6,8,9,12] },
  { color: '#B91C1C', borderColor: 'rgba(185,28,28,0.35)',  glowColor: 'rgba(185,28,28,0.12)',  spark: [1,2,1,3,4,5,4] },
  { color: '#EA580C', borderColor: 'rgba(234,88,12,0.2)',   glowColor: 'rgba(234,88,12,0.06)',  spark: [8,9,10,11,10,12,11] },
  { color: '#DC2626', borderColor: 'rgba(220,38,38,0.3)',   glowColor: 'rgba(220,38,38,0.10)',  spark: [2,3,2,4,5,4,6] },
  { color: '#F59E0B', borderColor: 'rgba(245,158,11,0.25)', glowColor: 'rgba(245,158,11,0.08)', spark: [60,65,68,72,74,76,78] },
];

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  forestsCount, changesCount, criticalAlertsCount, vehiclesCount, unpermittedCount, avgRisk
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  const v0 = useCounter(mounted ? forestsCount       : 0, 1000);
  const v1 = useCounter(mounted ? changesCount        : 0, 1100);
  const v2 = useCounter(mounted ? criticalAlertsCount : 0, 900);
  const v3 = useCounter(mounted ? vehiclesCount       : 0, 1050);
  const v4 = useCounter(mounted ? unpermittedCount    : 0, 950);
  const v5 = useCounter(mounted ? avgRisk             : 0, 1200);

  const cards = [
    { title: 'Monitored Forest Zones',       value: v0,            displayVal: v0,                 unit: 'Zones',    icon: Trees,      label: 'Copernicus Sentinel-2 AOIs' },
    { title: 'Forest Change Events',          value: v1,            displayVal: v1,                 unit: 'Events',   icon: AlertCircle,label: 'NDVI vegetation drops' },
    { title: 'Critical Investigation Alerts', value: v2,            displayVal: v2,                 unit: 'Alerts',   icon: ShieldAlert,label: 'High priority cases' },
    { title: 'Tracked Timber Vehicles',       value: v3,            displayVal: v3,                 unit: 'Vehicles', icon: Truck,      label: 'GPS telemetry feeds' },
    { title: 'Permit Mismatches',             value: v4,            displayVal: v4,                 unit: 'Vehicles', icon: FileX,      label: 'Missing / expired permits' },
    { title: 'Avg Investigation Risk',        value: v5,            displayVal: `${v5}/100`,        unit: 'Index',    icon: Flame,      label: 'Geospatial AI Score' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, idx) => {
        const cfg = CARD_CONFIGS[idx];
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="shimmer-card group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 animate-fade-slide-up"
            style={{
              background: 'rgba(28,8,0,0.85)',
              border: `1px solid ${cfg.borderColor}`,
              animationDelay: `${idx * 80}ms`,
            }}
          >
            {/* Corner glow */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-50 group-hover:opacity-90 transition-opacity duration-500"
              style={{ background: cfg.glowColor }}
            />

            {/* Header */}
            <div className="flex items-start justify-between relative z-10">
              <span className="text-[10px] font-medium leading-snug max-w-[100px]" style={{ color: 'rgba(245,220,200,0.6)' }}>
                {card.title}
              </span>
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${cfg.color}15`, borderColor: cfg.borderColor }}
              >
                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>
            </div>

            {/* Value */}
            <div className="mt-2 flex items-end justify-between relative z-10">
              <div>
                <span
                  className="font-orbitron text-2xl font-black animate-counter-flash"
                  style={{ color: cfg.color, animationDelay: `${idx * 80}ms` }}
                >
                  {card.displayVal}
                </span>
                <span className="ml-1.5 text-[10px] font-semibold" style={{ color: 'rgba(217,119,6,0.5)' }}>
                  {card.unit}
                </span>
              </div>
              <Sparkline data={cfg.spark} color={cfg.color} />
            </div>

            <p className="mt-1.5 text-[10px] truncate relative z-10" style={{ color: 'rgba(217,119,6,0.4)' }}>
              {card.label}
            </p>

            {/* Bottom glow line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}50, transparent)` }}
            />
          </div>
        );
      })}
    </div>
  );
};
