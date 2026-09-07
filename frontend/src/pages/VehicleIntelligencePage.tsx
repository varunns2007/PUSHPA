import React from 'react';
import type { Vehicle, TimberPermit } from '../types';
import { Truck, Navigation, Eye } from 'lucide-react';

interface VehicleIntelligencePageProps {
  vehicles: Vehicle[];
  permits: TimberPermit[];
  onSimulateStep: () => void;
  onSelectVehicle: (v: Vehicle) => void;
}

export const VehicleIntelligencePage: React.FC<VehicleIntelligencePageProps> = ({
  vehicles,
  onSimulateStep,
  onSelectVehicle
}) => {
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pushpa-panel p-4 rounded-xl border border-[#4A3022]/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <Truck className="h-5 w-5 text-[#D99A4A]" />
            <h2 className="font-title text-sm sm:text-base font-black uppercase tracking-wider text-[#F1E7D5]">
              TIMBER VEHICLE TELEMETRY & ROUTE CORRELATION
            </h2>
          </div>
          <p className="text-xs font-tactical text-[#A99A87] mt-0.5">
            GPS vehicle telemetry ingestion, corridor deviation analysis & permit verification
          </p>
        </div>

        <button
          onClick={onSimulateStep}
          className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-[#B65324] to-[#8E2B18] px-4 py-2 text-xs font-tactical font-black uppercase text-[#F1E7D5] border border-[#D99A4A]/60 shadow-md shadow-orange-950 hover:brightness-110 transition-all"
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>TRIGGER GPS SIMULATION STEP</span>
        </button>
      </div>

      {/* Vehicles Table */}
      <div className="pushpa-panel rounded-xl p-4 border border-[#4A3022]/60 space-y-3">
        <div className="flex items-center justify-between border-b border-[#4A3022]/40 pb-2.5">
          <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-[#F1E7D5]">
            MONITORED TIMBER VEHICLES ({vehicles.length})
          </h3>
          <span className="text-[10px] text-[#A99A87] font-mono">
            CORRIDOR DEVIATION THRESHOLD &gt; 2.0 km
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-tactical border-collapse">
            <thead>
              <tr className="border-b border-[#4A3022]/60 bg-[#12100D] text-[#A99A87] font-bold uppercase text-[10px]">
                <th className="p-2.5">VEHICLE ID</th>
                <th className="p-2.5">CATEGORY</th>
                <th className="p-2.5">GPS COORDINATES</th>
                <th className="p-2.5">SPEED</th>
                <th className="p-2.5">HEADING</th>
                <th className="p-2.5">ORIGIN &rarr; DESTINATION</th>
                <th className="p-2.5">DECLARED TIMBER</th>
                <th className="p-2.5">PERMIT STATE</th>
                <th className="p-2.5">RISK</th>
                <th className="p-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4A3022]/30 font-medium">
              {vehicles.map((v) => {
                const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'VERY HIGH';
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-[#1D1813] transition-colors ${
                      isCritical ? 'bg-[#5C160F]/20' : ''
                    }`}
                  >
                    <td className="p-2.5 font-mono font-bold text-[#F1E7D5]">
                      {v.vehicle_number}
                    </td>
                    <td className="p-2.5 text-[#A99A87]">{v.vehicle_type}</td>
                    <td className="p-2.5 font-mono text-[#A99A87]">
                      {v.current_lat.toFixed(4)}°, {v.current_lng.toFixed(4)}°
                    </td>
                    <td className="p-2.5 text-[#D99A4A] font-mono font-bold">{v.speed_kmh} km/h</td>
                    <td className="p-2.5 text-[#A99A87] font-mono">{v.heading_deg}°</td>
                    <td className="p-2.5 text-[#F1E7D5]">
                      <div>{v.origin}</div>
                      <div className="text-[10px] text-[#74695D] font-mono">&rarr; {v.destination}</div>
                    </td>
                    <td className="p-2.5 text-[#D99A4A] font-mono font-bold">{v.declared_quantity_m3} m³</td>
                    <td className="p-2.5">
                      {v.permit_status === 'VALID' ? (
                        <span className="rounded bg-[#121A11] px-2 py-0.5 text-[10px] font-bold text-[#718C48] border border-[#718C48]">
                          VALID
                        </span>
                      ) : (
                        <span className="rounded bg-[#5C160F] px-2 py-0.5 text-[10px] font-bold text-[#D52B1E] border border-[#D52B1E]">
                          {v.permit_status}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        isCritical
                          ? 'bg-[#5C160F] text-[#D52B1E] border border-[#D52B1E]'
                          : 'bg-[#1D1813] text-[#A99A87]'
                      }`}>
                        {v.risk_level}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onSelectVehicle(v)}
                        className="flex items-center space-x-1 ml-auto rounded bg-[#1D1813] border border-[#4A3022] px-2 py-1 text-[11px] font-bold text-[#D99A4A] hover:bg-[#8E2B18] hover:text-[#F1E7D5] transition-all"
                      >
                        <Eye className="h-3 w-3" />
                        <span>LOCATE</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
