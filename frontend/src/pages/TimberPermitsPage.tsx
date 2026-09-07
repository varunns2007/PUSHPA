import React from 'react';
import type { TimberPermit } from '../types';
import { FileCheck, ShieldCheck, AlertCircle } from 'lucide-react';

interface TimberPermitsPageProps {
  permits: TimberPermit[];
}

export const TimberPermitsPage: React.FC<TimberPermitsPageProps> = ({ permits }) => {
  return (
    <div className="space-y-4 animate-fade-slide-up">
      <div
        className="flex items-center justify-between rounded-xl p-4"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.25)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl animate-glow-orange" style={{ background: 'linear-gradient(135deg, #7F1D1D, #EA580C)' }}>
            <FileCheck className="h-5 w-5" style={{ color: '#FEE2E2' }} />
          </div>
          <div>
            <h2 className="font-orbitron text-xs font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              LEGAL TIMBER PERMIT DATABASE
            </h2>
            <p className="text-[10px]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Authorized timber harvest &amp; transport permits registered under state forest departments
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 font-orbitron text-[9px] font-black"
          style={{ background: 'rgba(28,8,0,0.9)', color: '#D97706', border: '1px solid rgba(217,119,6,0.4)' }}
        >
          {permits.length} REGISTERED PERMITS
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
                <th className="p-3">PERMIT ID</th>
                <th className="p-3">VEHICLE ID</th>
                <th className="p-3">HARVEST SOURCE</th>
                <th className="p-3">DESTINATION DEPOT</th>
                <th className="p-3">APPROVED AREA</th>
                <th className="p-3">QUOTA (M³)</th>
                <th className="p-3">VALIDITY WINDOW</th>
                <th className="p-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="font-medium divide-y" style={{ borderColor: 'rgba(185,28,28,0.1)' }}>
              {permits.map((p) => (
                <tr
                  key={p.permit_id}
                  className="transition-colors hover:bg-red-950/20"
                  style={{ borderBottom: '1px solid rgba(185,28,28,0.1)' }}
                >
                  <td className="p-3 font-mono-hud font-bold" style={{ color: '#EA580C' }}>{p.permit_id}</td>
                  <td className="p-3 font-mono-hud text-[11px]" style={{ color: '#F5E6DC' }}>{p.vehicle_id}</td>
                  <td className="p-3 text-[11px]" style={{ color: 'rgba(245,230,220,0.8)' }}>{p.source_location}</td>
                  <td className="p-3 text-[11px]" style={{ color: 'rgba(245,230,220,0.8)' }}>{p.destination}</td>
                  <td className="p-3 text-[11px]" style={{ color: 'rgba(217,119,6,0.7)' }}>{p.approved_area}</td>
                  <td className="p-3 font-orbitron font-bold" style={{ color: '#D97706' }}>{p.approved_quantity_m3} m³</td>
                  <td className="p-3 font-mono-hud text-[10px]" style={{ color: 'rgba(245,230,220,0.6)' }}>
                    {p.valid_from} → {p.valid_until}
                  </td>
                  <td className="p-3 text-right">
                    {p.status === 'VALID' ? (
                      <span
                        className="rounded px-2.5 py-1 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.35)' }}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        VALID
                      </span>
                    ) : (
                      <span
                        className="rounded px-2.5 py-1 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1"
                        style={{ background: 'rgba(217,119,6,0.2)', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.4)' }}
                      >
                        <AlertCircle className="h-3 w-3" />
                        {p.status}
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
