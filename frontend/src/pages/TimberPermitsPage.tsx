import React from 'react';
import type { TimberPermit } from '../types';
import { FileCheck, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';

interface TimberPermitsPageProps {
  permits: TimberPermit[];
}

export const TimberPermitsPage: React.FC<TimberPermitsPageProps> = ({ permits }) => {
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-[#102410] text-[#718C48] border border-[#2b4c1e]">
            <CheckCircle2 className="w-3 h-3" />
            VALID
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-[#2a1708] text-[#D99A4A] border border-[#523315]">
            <ShieldAlert className="w-3 h-3" />
            EXPIRED
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-[#260e0a] text-[#8E2B18] border border-[#4d1912]">
            <ShieldAlert className="w-3 h-3" />
            REVOKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-[#1d1813] text-[#A99A87] border border-[#30271f]">
            <HelpCircle className="w-3 h-3" />
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="pushpa-panel p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#718C48]/10 border border-[#718C48]/30">
            <FileCheck className="h-5 w-5 text-[#718C48]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1E7D5] font-display">
              LEGAL TIMBER PERMIT DATABASE
            </h2>
            <p className="text-xs text-[#A99A87]">
              State forest authority transit manifests, harvest permits & transit corridors
            </p>
          </div>
        </div>
        <span className="rounded px-3 py-1 text-xs font-mono font-bold text-[#718C48] bg-[#102410] border border-[#2b4c1e]">
          {permits.length} REGISTERED PERMITS
        </span>
      </div>

      <div className="pushpa-panel p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#241e17] bg-[#12100D] text-[#A99A87] font-bold uppercase text-[10px] tracking-wider">
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
            <tbody className="divide-y divide-[#1D1813] font-medium">
              {permits.map((p) => (
                <tr key={p.permit_id} className="hover:bg-[#1D1813]/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#718C48]">{p.permit_id}</td>
                  <td className="p-3 font-mono text-[#F1E7D5]">{p.vehicle_id}</td>
                  <td className="p-3 text-[#A99A87]">{p.source_location}</td>
                  <td className="p-3 text-[#A99A87]">{p.destination}</td>
                  <td className="p-3 text-[#74695D]">{p.approved_area}</td>
                  <td className="p-3 font-bold font-mono text-[#D99A4A]">{p.approved_quantity_m3} m³</td>
                  <td className="p-3 font-mono text-[#74695D] text-[11px]">
                    {p.valid_from} → {p.valid_until}
                  </td>
                  <td className="p-3 text-right">
                    {renderStatusBadge(p.status)}
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
