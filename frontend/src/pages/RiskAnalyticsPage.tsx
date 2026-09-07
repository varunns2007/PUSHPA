import React from 'react';
import { AlertTriangle, Sliders, Flame } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const RiskAnalyticsPage: React.FC = () => {
  const factorWeights = [
    { name: 'Forest Change Severity', weight: 30, color: '#ef4444', desc: 'NDVI magnitude drop in satellite AOI' },
    { name: 'Vegetation Density Loss', weight: 20, color: '#f97316', desc: 'Hectares of contiguous canopy clearing' },
    { name: 'Permit Anomaly', weight: 20, color: '#f59e0b', desc: 'Absence or expiration of legal timber permit' },
    { name: 'Vehicle Route Anomaly', weight: 15, color: '#06b6d4', desc: 'Deviation from authorized transport corridor' },
    { name: 'Historical Risk', weight: 10, color: '#8b5cf6', desc: 'Proximity to prior illegal logging incidents' },
    { name: 'Spatial Proximity', weight: 5, color: '#10b981', desc: 'Distance between vehicle and clearing centroid' },
  ];

  const riskTiers = [
    { range: '0 – 29', level: 'LOW', color: 'slate', badge: '⚪ LOW', detail: 'Normal forest variation or legal timber activity' },
    { range: '30 – 49', level: 'MODERATE', color: 'emerald', badge: '🟢 MODERATE', detail: 'Minor vegetation drop or unverified route' },
    { range: '50 – 69', level: 'HIGH', color: 'amber', badge: '🟡 HIGH', detail: 'Substantial vegetation loss near transport road' },
    { range: '70 – 84', level: 'VERY HIGH', color: 'orange', badge: '🟠 VERY HIGH', detail: 'Correlated clearing, vehicle presence & permit gap' },
    { range: '85 – 100', level: 'CRITICAL', color: 'red', badge: '🔴 CRITICAL', detail: 'Multiple high-confidence illegal logging indicators' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gis-glass p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              EXPLAINABLE AI RISK ENGINE
            </h2>
            <p className="text-xs text-slate-400">
              Transparent multi-factor illegal logging investigation prioritization model
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factor Distribution Chart */}
        <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
            <Sliders className="h-4 w-4 mr-1.5" />
            Configurable Factor Weights (% Contribution)
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorWeights} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 35]} stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
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
        <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
            <Flame className="h-4 w-4 mr-1.5" />
            Investigation Risk Tiers (0 – 100 Score Scale)
          </h3>

          <div className="space-y-2.5">
            {riskTiers.map((tier, idx) => (
              <div key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100">{tier.badge}</span>
                    <span className="font-mono text-slate-400">Score: {tier.range}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{tier.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
