import React from 'react';
import type { HistoricalIncident } from '../types';
import { ShieldAlert } from 'lucide-react';

interface HistoricalIncidentsPageProps {
  incidents: HistoricalIncident[];
}

export const HistoricalIncidentsPage: React.FC<HistoricalIncidentsPageProps> = ({ incidents }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gis-glass p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              HISTORICAL INCIDENT DATABASE
            </h2>
            <p className="text-xs text-slate-400">
              Geospatially indexed historical illegal logging & timber smuggling events
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-800">
          {incidents.length} HISTORICAL RECORDS
        </span>
      </div>

      <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Incident ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Forest Area</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Incident Type</th>
                <th className="p-3">Est. Quantity</th>
                <th className="p-3">Associated Vehicle</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {incidents.slice(0, 50).map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-900/90 transition-colors">
                  <td className="p-3 font-mono font-bold text-amber-400">{inc.id}</td>
                  <td className="p-3 font-mono text-slate-300">{inc.incident_date}</td>
                  <td className="p-3 font-bold text-slate-100">{inc.forest_name}</td>
                  <td className="p-3 font-mono text-slate-400">
                    {inc.latitude.toFixed(4)}°, {inc.longitude.toFixed(4)}°
                  </td>
                  <td className="p-3 text-slate-200">{inc.incident_type}</td>
                  <td className="p-3 font-bold text-rose-400">{inc.estimated_quantity_m3} m³</td>
                  <td className="p-3 font-mono text-slate-400">{inc.associated_vehicle_id || '—'}</td>
                  <td className="p-3 text-right">
                    <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-800">
                      {inc.status}
                    </span>
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
