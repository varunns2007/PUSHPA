import React from 'react';
import { AlertTriangle, Sliders, Flame } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const RiskAnalyticsPage: React.FC = () => {
  const factorWeights = [
    { name: 'Forest Change Severity', weight: 30, color: '#dc2626', desc: 'NDVI magnitude drop in satellite AOI' },
    { name: 'Vegetation Density Loss', weight: 20, color: '#ea580c', desc: 'Hectares of contiguous canopy clearing' },
    { name: 'Permit Anomaly', weight: 20, color: '#d97706', desc: 'Absence or expiration of legal timber permit' },
    { name: 'Vehicle Route Anomaly', weight: 15, color: '#f59e0b', desc: 'Deviation from authorized transport corridor' },
    { name: 'Historical Risk', weight: 10, color: '#b91c1c', desc: 'Proximity to prior illegal logging incidents' },
    { name: 'Spatial Proximity', weight: 5, color: '#fb923c', desc: 'Distance between vehicle and clearing centroid' },
  ];

  const riskTiers = [
    { range: '0 – 29', level: 'LOW', badgeColor: '#9ca3af', bg: 'rgba(55,65,81,0.2)', border: 'rgba(107,114,128,0.3)', badge: '⚪ LOW', detail: 'Normal forest variation or legal timber activity' },
    { range: '30 – 49', level: 'MODERATE', badgeColor: '#86efac', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', badge: '🟢 MODERATE', detail: 'Minor vegetation drop or unverified route' },
    { range: '50 – 69', level: 'HIGH', badgeColor: '#fcd34d', bg: 'rgba(217,119,6,0.2)', border: 'rgba(217,119,6,0.4)', badge: '🟡 HIGH', detail: 'Substantial vegetation loss near transport road' },
    { range: '70 – 84', level: 'VERY HIGH', badgeColor: '#fdba74', bg: 'rgba(234,88,12,0.25)', border: 'rgba(234,88,12,0.5)', badge: '🟠 VERY HIGH', detail: 'Correlated clearing, vehicle presence & permit gap' },
    { range: '85 – 100', level: 'CRITICAL', badgeColor: '#fca5a5', bg: 'rgba(185,28,28,0.35)', border: 'rgba(220,38,38,0.6)', badge: '🔴 CRITICAL', detail: 'Multiple high-confidence illegal logging indicators' },
  ];

  return (
    <div className="space-y-4 animate-fade-slide-up">
      <div
        className="flex items-center justify-between rounded-xl p-4"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.25)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl animate-glow-red" style={{ background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)' }}>
            <AlertTriangle className="h-5 w-5" style={{ color: '#FCA5A5' }} />
          </div>
          <div>
            <h2 className="font-orbitron text-xs font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              EXPLAINABLE AI RISK ENGINE
            </h2>
            <p className="text-[10px]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Transparent multi-factor illegal logging investigation prioritization model
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factor Distribution Chart */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}
        >
          <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#EA580C' }}>
            <Sliders className="h-4 w-4 mr-1.5" />
            Configurable Factor Weights (% Contribution)
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorWeights} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 35]} stroke="rgba(217,119,6,0.5)" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="rgba(245,230,220,0.8)" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,3,0,0.95)',
                    border: '1px solid rgba(185,28,28,0.4)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F5E6DC'
                  }}
                />
                <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                  {factorWeights.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Tiers Legend */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}
        >
          <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#FCA5A5' }}>
            <Flame className="h-4 w-4 mr-1.5 animate-flame" style={{ color: '#EA580C' }} />
            Investigation Risk Tiers (0 – 100 Score Scale)
          </h3>

          <div className="space-y-2.5">
            {riskTiers.map((tier, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl flex items-center justify-between text-xs"
                style={{
                  background: tier.bg,
                  border: `1px solid ${tier.border}`
                }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-orbitron text-[10px] font-black" style={{ color: tier.badgeColor }}>{tier.badge}</span>
                    <span className="font-mono-hud text-[10px]" style={{ color: 'rgba(217,119,6,0.7)' }}>Score: {tier.range}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: 'rgba(245,230,220,0.8)' }}>{tier.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
