import React from 'react';
import type { HistoricalIncident } from '../types';
import { ShieldAlert } from 'lucide-react';

interface HistoricalIncidentsPageProps {
  incidents: HistoricalIncident[];
}

export const HistoricalIncidentsPage: React.FC<HistoricalIncidentsPageProps> = ({ incidents }) => {
  return (
    <div className="space-y-4">
      <div className="pushpa-panel p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#D99A4A]/10 border border-[#D99A4A]/30">
            <ShieldAlert className="h-5 w-5 text-[#D99A4A]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1E7D5] font-display">
              HISTORICAL INCIDENT DATABASE
            </h2>
            <p className="text-xs text-[#A99A87]">
              Geospatially indexed historical unauthorized clearing & timber smuggling events
            </p>
          </div>
        </div>
        <span className="rounded px-3 py-1 text-xs font-mono font-bold text-[#D99A4A] bg-[#2a1708] border border-[#523315]">
          {incidents.length} HISTORICAL RECORDS
        </span>
      </div>

      <div className="pushpa-panel p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#241e17] bg-[#12100D] text-[#A99A87] font-bold uppercase text-[10px] tracking-wider">
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
            <tbody className="divide-y divide-[#1D1813] font-medium">
              {incidents.slice(0, 50).map((inc) => (
                <tr key={inc.id} className="hover:bg-[#1D1813]/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#D99A4A]">{inc.id}</td>
                  <td className="p-3 font-mono text-[#A99A87]">{inc.incident_date}</td>
                  <td className="p-3 font-bold text-[#F1E7D5]">{inc.forest_name}</td>
                  <td className="p-3 font-mono text-[#74695D]">
                    {inc.latitude.toFixed(4)}°, {inc.longitude.toFixed(4)}°
                  </td>
                  <td className="p-3 text-[#A99A87]">{inc.incident_type}</td>
                  <td className="p-3 font-mono font-bold text-[#8E2B18]">{inc.estimated_quantity_m3} m³</td>
                  <td className="p-3 font-mono text-[#74695D]">{inc.associated_vehicle_id || '—'}</td>
                  <td className="p-3 text-right">
                    <span className="rounded bg-[#260e0a] px-2 py-0.5 text-[10px] font-bold text-[#8E2B18] border border-[#4d1912]">
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
