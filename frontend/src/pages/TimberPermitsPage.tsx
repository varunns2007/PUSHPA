import React from 'react';
import type { TimberPermit } from '../types';
import { FileCheck } from 'lucide-react';

interface TimberPermitsPageProps {
  permits: TimberPermit[];
}

export const TimberPermitsPage: React.FC<TimberPermitsPageProps> = ({ permits }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gis-glass p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              LEGAL TIMBER PERMIT DATABASE
            </h2>
            <p className="text-xs text-slate-400">
              Authorized timber harvest & transport permits registered under state forest departments
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800">
          {permits.length} REGISTERED PERMITS
        </span>
      </div>

      <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Permit ID</th>
                <th className="p-3">Vehicle ID</th>
                <th className="p-3">Harvest Source</th>
                <th className="p-3">Destination Depot</th>
                <th className="p-3">Approved Area</th>
                <th className="p-3">Quota (m³)</th>
                <th className="p-3">Validity Window</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {permits.map((p) => (
                <tr key={p.permit_id} className="hover:bg-slate-900/90 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{p.permit_id}</td>
                  <td className="p-3 font-mono text-slate-200">{p.vehicle_id}</td>
                  <td className="p-3 text-slate-300">{p.source_location}</td>
                  <td className="p-3 text-slate-300">{p.destination}</td>
                  <td className="p-3 text-slate-400">{p.approved_area}</td>
                  <td className="p-3 font-bold text-amber-400">{p.approved_quantity_m3} m³</td>
                  <td className="p-3 font-mono text-slate-400">
                    {p.valid_from} → {p.valid_until}
                  </td>
                  <td className="p-3 text-right">
                    {p.status === 'VALID' ? (
                      <span className="rounded bg-emerald-950 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                        ✅ VALID
                      </span>
                    ) : (
                      <span className="rounded bg-amber-950 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-800">
                        ⚠️ {p.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
