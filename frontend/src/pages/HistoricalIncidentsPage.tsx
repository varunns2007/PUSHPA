import React from 'react';
import type { HistoricalIncident } from '../types';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface HistoricalIncidentsPageProps {
  incidents: HistoricalIncident[];
}

export const HistoricalIncidentsPage: React.FC<HistoricalIncidentsPageProps> = ({ incidents }) => {
  return (
    <div className="space-y-4 animate-fade-slide-up">
      <div
        className="flex items-center justify-between rounded-xl p-4"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.25)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl animate-glow-red" style={{ background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)' }}>
            <ShieldAlert className="h-5 w-5" style={{ color: '#FCA5A5' }} />
          </div>
          <div>
            <h2 className="font-orbitron text-xs font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              HISTORICAL INCIDENT DATABASE
            </h2>
            <p className="text-[10px]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Geospatially indexed historical illegal logging &amp; timber smuggling events
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 font-orbitron text-[9px] font-black"
          style={{ background: 'rgba(127,29,29,0.35)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.4)' }}
        >
          {incidents.length} HISTORICAL RECORDS
        </span>
      </div>

      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="text-[9px] font-orbitron font-bold uppercase tracking-wider"
                style={{ background: 'rgba(10,3,0,0.85)', color: 'rgba(217,119,6,0.6)', borderBottom: '1px solid rgba(185,28,28,0.2)' }}
              >
                <th className="p-3">INCIDENT ID</th>
                <th className="p-3">DATE</th>
                <th className="p-3">FOREST AREA</th>
                <th className="p-3">COORDINATES</th>
                <th className="p-3">INCIDENT TYPE</th>
                <th className="p-3">EST. QUANTITY</th>
                <th className="p-3">ASSOCIATED VEHICLE</th>
                <th className="p-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="font-medium divide-y" style={{ borderColor: 'rgba(185,28,28,0.1)' }}>
              {incidents.slice(0, 50).map((inc) => (
                <tr
                  key={inc.id}
                  className="transition-colors hover:bg-red-950/20"
                  style={{ borderBottom: '1px solid rgba(185,28,28,0.1)' }}
                >
                  <td className="p-3 font-mono-hud font-bold" style={{ color: '#EA580C' }}>{inc.id}</td>
                  <td className="p-3 font-mono-hud text-[11px]" style={{ color: '#F5E6DC' }}>{inc.incident_date}</td>
                  <td className="p-3 font-bold text-[11px]" style={{ color: '#F5E6DC' }}>{inc.forest_name}</td>
                  <td className="p-3 font-mono-hud text-[10px]" style={{ color: 'rgba(217,119,6,0.75)' }}>
                    {inc.latitude.toFixed(4)}°, {inc.longitude.toFixed(4)}°
                  </td>
                  <td className="p-3 text-[11px]" style={{ color: 'rgba(245,230,220,0.8)' }}>{inc.incident_type}</td>
                  <td className="p-3 font-orbitron font-bold" style={{ color: '#DC2626' }}>{inc.estimated_quantity_m3} m³</td>
                  <td className="p-3 font-mono-hud text-[11px]" style={{ color: 'rgba(245,230,220,0.6)' }}>{inc.associated_vehicle_id || '—'}</td>
                  <td className="p-3 text-right">
                    <span
                      className="rounded px-2.5 py-1 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1"
                      style={{ background: 'rgba(127,29,29,0.4)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.5)' }}
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
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
