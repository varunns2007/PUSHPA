import React from 'react';
import type { Vehicle, TimberPermit } from '../types';
import { Truck, Navigation } from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-between gap-3 gis-glass p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              VEHICLE INTELLIGENCE & ROUTE TRACKER
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time digital record ingestion & simulated timber transport movement analytics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSimulateStep}
            className="flex items-center space-x-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/40 transition-all"
          >
            <Navigation className="h-4 w-4" />
            <span>TRIGGER GPS SIMULATION STEP</span>
          </button>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          MONITORED TIMBER VEHICLES ({vehicles.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Vehicle ID</th>
                <th className="p-3">Vehicle Type</th>
                <th className="p-3">Current Location</th>
                <th className="p-3">Speed</th>
                <th className="p-3">Heading</th>
                <th className="p-3">Origin / Destination</th>
                <th className="p-3">Declared Cargo</th>
                <th className="p-3">Permit Status</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {vehicles.map((v) => {
                const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'VERY HIGH';
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-slate-900/90 transition-colors ${
                      isCritical ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>🚛</span>
                      <span>{v.vehicle_number}</span>
                    </td>
                    <td className="p-3 text-slate-300">{v.vehicle_type}</td>
                    <td className="p-3 font-mono text-slate-400">
                      {v.current_lat.toFixed(4)}°, {v.current_lng.toFixed(4)}°
                    </td>
                    <td className="p-3 text-cyan-400 font-bold">{v.speed_kmh} km/h</td>
                    <td className="p-3 text-slate-400">{v.heading_deg}°</td>
                    <td className="p-3 text-slate-300">
                      <div>{v.origin}</div>
                      <div className="text-[10px] text-slate-500">→ {v.destination}</div>
                    </td>
                    <td className="p-3 text-amber-400 font-bold">{v.declared_quantity_m3} m³</td>
                    <td className="p-3">
                      {v.permit_status === 'VALID' ? (
                        <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                          ✅ VALID
                        </span>
                      ) : (
                        <span className="rounded bg-rose-950 px-2 py-0.5 text-[10px] font-black text-rose-400 border border-rose-800 animate-pulse">
                          ❌ NOT FOUND
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isCritical ? (
                        <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-800">
                          🔴 {v.risk_level}
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          🟢 {v.risk_level}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectVehicle(v)}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                      >
                        INSPECT
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
