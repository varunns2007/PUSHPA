import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingDown, Satellite, AlertTriangle } from 'lucide-react';

interface DailyComparisonPanelProps {
  forestName: string;
}

// Simulated 7-day NDVI data for Nilgiri Zone A
function generateNDVITimeline() {
  const days = [
    { day: '-7d', date: '31 Aug', ndvi: 0.74, label: 'Baseline' },
    { day: '-6d', date: '01 Sep', ndvi: 0.72, label: '' },
    { day: '-5d', date: '02 Sep', ndvi: 0.71, label: '' },
    { day: '-4d', date: '03 Sep', ndvi: 0.68, label: 'Initial Drop' },
    { day: '-3d', date: '04 Sep', ndvi: 0.59, label: '⚠ ANOMALY' },
    { day: '-2d', date: '05 Sep', ndvi: 0.47, label: '🔴 CRITICAL' },
    { day: '-1d', date: '06 Sep', ndvi: 0.44, label: '' },
    { day: 'Now', date: '07 Sep', ndvi: 0.41, label: 'TODAY' },
  ];
  return days;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const ndvi = payload[0].value;
  const isAnomaly = ndvi < 0.55;
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${
      isAnomaly
        ? 'bg-red-950/95 border-red-700/60 text-red-300'
        : 'bg-slate-900/95 border-slate-700/60 text-slate-300'
    }`}>
      <div className="font-bold mb-0.5">{label} — {payload[0].payload.date}</div>
      <div className="font-mono-hud">NDVI: <span className={`font-black text-sm ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>{ndvi.toFixed(3)}</span></div>
      {payload[0].payload.label && (
        <div className={`text-[10px] mt-0.5 font-bold ${isAnomaly ? 'text-red-400' : 'text-slate-400'}`}>
          {payload[0].payload.label}
        </div>
      )}
    </div>
  );
};

export const DailyComparisonPanel: React.FC<DailyComparisonPanelProps> = ({ forestName }) => {
  const timeline = useMemo(() => generateNDVITimeline(), []);
  const baseline  = timeline[0].ndvi;
  const latest    = timeline[timeline.length - 1].ndvi;
  const changePct = (((baseline - latest) / baseline) * 100).toFixed(1);
  const lossHa    = (parseFloat(changePct) * 0.35).toFixed(1); // ~0.35 ha per %

  return (
    <div className="gis-glass rounded-xl border border-slate-800 flex flex-col h-full animate-fade-slide-up delay-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Satellite className="h-4 w-4 text-cyan-400" />
          <div>
            <h2 className="font-orbitron text-xs font-black uppercase tracking-widest text-cyan-400 text-glow-cyan">
              DAILY SATELLITE COMPARISON
            </h2>
            <p className="text-[10px] text-slate-400">{forestName} — 7-Day NDVI Timeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-red-950/70 border border-red-900/60 px-2 py-1 text-[10px] font-black text-red-400 animate-glow-red">
            <TrendingDown className="inline h-3 w-3 mr-1" />
            {changePct}% NDVI DROP
          </span>
        </div>
      </div>

      {/* Before / After satellite tiles (simulated canvas) */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {/* Before tile */}
        <div className="rounded-xl border border-emerald-900/40 overflow-hidden">
          <div className="bg-emerald-950/40 px-2 py-1 border-b border-emerald-900/30 text-[9px] font-orbitron text-emerald-400 uppercase tracking-widest">
            📡 31 AUG — BASELINE
          </div>
          <div
            className="relative"
            style={{
              height: '100px',
              background: 'radial-gradient(ellipse at 40% 40%, #166534 0%, #14532d 30%, #052e16 60%, #020913 100%)',
            }}
          >
            {/* Simulated forest canopy dots */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  left: `${10 + (i * 37) % 80}%`,
                  top:  `${10 + (i * 53) % 80}%`,
                  width: `${4 + (i % 3) * 3}px`,
                  height: `${4 + (i % 3) * 3}px`,
                  background: i % 5 === 0 ? '#34d399' : '#059669',
                  opacity: 0.6 + (i % 4) * 0.1,
                }}
              />
            ))}
            <div className="absolute bottom-1 right-2 text-[9px] font-mono-hud text-emerald-400 font-bold">NDVI: 0.740</div>
          </div>
        </div>

        {/* After tile */}
        <div className="rounded-xl border border-red-900/40 overflow-hidden">
          <div className="bg-red-950/40 px-2 py-1 border-b border-red-900/30 text-[9px] font-orbitron text-red-400 uppercase tracking-widest">
            📡 07 SEP — TODAY
          </div>
          <div
            className="relative"
            style={{
              height: '100px',
              background: 'radial-gradient(ellipse at 40% 40%, #7f1d1d 0%, #581c1c 30%, #1c1c1c 60%, #020913 100%)',
            }}
          >
            {/* Fewer dots = deforested */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  left: `${60 + (i * 23) % 35}%`,
                  top:  `${60 + (i * 31) % 35}%`,
                  width: `${3 + (i % 2) * 2}px`,
                  height: `${3 + (i % 2) * 2}px`,
                  background: '#059669',
                  opacity: 0.4,
                }}
              />
            ))}
            {/* Red cleared zone */}
            <div className="absolute top-[20%] left-[15%] w-16 h-12 rounded-full animate-glow-red opacity-40"
              style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)' }} />
            <div className="absolute bottom-1 right-2 text-[9px] font-mono-hud text-red-400 font-bold">NDVI: 0.410</div>
            <div className="absolute top-2 left-2 text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded">
              ⚠ CLEARED
            </div>
          </div>
        </div>
      </div>

      {/* Loss stats */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-2">
        {[
          { label: 'NDVI Before', value: baseline.toFixed(3), color: 'text-emerald-400' },
          { label: 'NDVI Today',  value: latest.toFixed(3),   color: 'text-red-400' },
          { label: 'Est. Loss',   value: `~${lossHa} ha`,     color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800/60 text-center">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</div>
            <div className={`font-orbitron text-sm font-black mt-0.5 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* NDVI Area Chart */}
      <div className="flex-1 px-4 pb-3 pt-1 min-h-0">
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">7-Day NDVI Trend</span>
        </div>
        <div style={{ height: '100px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"   stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%"  stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0.3, 0.8]} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {/* Critical threshold */}
              <ReferenceLine y={0.55} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Alert', fill: '#f59e0b', fontSize: 8, position: 'right' }} />
              <Area
                type="monotone"
                dataKey="ndvi"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#ndviGrad)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isAnom = payload.ndvi < 0.55;
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx} cy={cy} r={isAnom ? 5 : 3}
                      fill={isAnom ? '#ef4444' : '#10b981'}
                      stroke={isAnom ? '#fca5a5' : '#6ee7b7'}
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
