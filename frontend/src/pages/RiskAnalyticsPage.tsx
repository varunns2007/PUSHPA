import React from 'react';
import { AlertTriangle, Sliders, Flame } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const RiskAnalyticsPage: React.FC = () => {
  const factorWeights = [
    { name: 'Forest Change Severity', weight: 30, color: '#8E2B18', desc: 'NDVI magnitude drop in satellite AOI' },
    { name: 'Vegetation Density Loss', weight: 20, color: '#B65324', desc: 'Hectares of contiguous canopy clearing' },
    { name: 'Permit Anomaly', weight: 20, color: '#D99A4A', desc: 'Absence or expiration of legal timber permit' },
    { name: 'Vehicle Route Anomaly', weight: 15, color: '#718C48', desc: 'Deviation from authorized transport corridor' },
    { name: 'Historical Risk', weight: 10, color: '#8b5cf6', desc: 'Proximity to prior unauthorized clearing incidents' },
    { name: 'Spatial Proximity', weight: 5, color: '#3b82f6', desc: 'Distance between vehicle and clearing centroid' },
  ];

  const riskTiers = [
    { range: '0 – 29', level: 'LOW', badgeBg: 'bg-[#102410]', textColor: 'text-[#718C48]', border: 'border-[#2b4c1e]', detail: 'Normal forest variation or legal timber activity' },
    { range: '30 – 49', level: 'MODERATE', badgeBg: 'bg-[#172520]', textColor: 'text-[#5a9c68]', border: 'border-[#2d563a]', detail: 'Minor vegetation drop or unverified route' },
    { range: '50 – 69', level: 'HIGH', badgeBg: 'bg-[#2a1708]', textColor: 'text-[#D99A4A]', border: 'border-[#523315]', detail: 'Substantial vegetation loss near transport road' },
    { range: '70 – 84', level: 'VERY HIGH', badgeBg: 'bg-[#33140a]', textColor: 'text-[#B65324]', border: 'border-[#612715]', detail: 'Correlated clearing, vehicle presence & permit gap' },
    { range: '85 – 100', level: 'CRITICAL', badgeBg: 'bg-[#260e0a]', textColor: 'text-[#8E2B18]', border: 'border-[#4d1912]', detail: 'Multiple high-confidence disturbance indicators' },
  ];

  return (
    <div className="space-y-4">
      <div className="pushpa-panel p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#8E2B18]/10 border border-[#8E2B18]/30">
            <AlertTriangle className="h-5 w-5 text-[#8E2B18]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1E7D5] font-display">
              EXPLAINABLE RISK ENGINE
            </h2>
            <p className="text-xs text-[#A99A87]">
              Multi-factor heuristic prioritization model with separate severity and confidence metrics
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factor Distribution Chart */}
        <div className="pushpa-panel p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#718C48] flex items-center">
            <Sliders className="h-4 w-4 mr-1.5" />
            Configurable Factor Weights (% Contribution)
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorWeights} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 35]} stroke="#74695D" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#A99A87" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ background: '#12100D', borderColor: '#241e17', borderRadius: '6px', fontSize: '11px', color: '#F1E7D5' }}
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
        <div className="pushpa-panel p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#D99A4A] flex items-center">
            <Flame className="h-4 w-4 mr-1.5" />
            Investigation Risk Tiers (0 – 100 Score Scale)
          </h3>

          <div className="space-y-2.5">
            {riskTiers.map((tier, idx) => (
              <div key={idx} className="bg-[#12100D] p-3 rounded border border-[#241e17] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tier.badgeBg} ${tier.textColor} ${tier.border}`}>
                      {tier.level}
                    </span>
                    <span className="font-mono text-[#A99A87]">Score: {tier.range}</span>
                  </div>
                  <p className="text-[11px] text-[#74695D]">{tier.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
