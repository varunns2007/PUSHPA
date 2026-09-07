import React from 'react';
import type { Vehicle, TimberPermit } from '../types';
import { Truck, Navigation, AlertTriangle, CheckCircle2, ShieldX, ArrowRight } from 'lucide-react';

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
    <div className="space-y-4 animate-fade-slide-up">
      {/* Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.25)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl animate-glow-orange" style={{ background: 'linear-gradient(135deg, #7F1D1D, #EA580C)' }}>
            <Truck className="h-5 w-5" style={{ color: '#FEE2E2' }} />
          </div>
          <div>
            <h2 className="font-orbitron text-xs font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              VEHICLE INTELLIGENCE &amp; ROUTE TRACKER
            </h2>
            <p className="text-[10px]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Real-time digital record ingestion &amp; simulated timber transport movement analytics
            </p>
          </div>
        </div>

        <button
          onClick={onSimulateStep}
          className="flex items-center space-x-2 rounded-xl px-4 py-2.5 font-orbitron text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
            border: '1px solid rgba(185,28,28,0.6)',
            color: '#FEE2E2',
            boxShadow: '0 0 20px rgba(185,28,28,0.3)'
          }}
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>TRIGGER GPS SIMULATION STEP</span>
        </button>
      </div>

      {/* Vehicles Table */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
            MONITORED TIMBER VEHICLES ({vehicles.length})
          </h3>
          <span className="font-mono-hud text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(234,88,12,0.15)', color: '#EA580C', border: '1px solid rgba(234,88,12,0.3)' }}>
            CORRIDOR ANOMALY SCANNER ACTIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="text-[9px] font-orbitron font-bold uppercase tracking-wider"
                style={{ background: 'rgba(10,3,0,0.85)', color: 'rgba(217,119,6,0.6)', borderBottom: '1px solid rgba(185,28,28,0.2)' }}
              >
                <th className="p-3">VEHICLE NUMBER</th>
                <th className="p-3">TYPE</th>
                <th className="p-3">CURRENT LOCATION</th>
                <th className="p-3">SPEED</th>
                <th className="p-3">HEADING</th>
                <th className="p-3">ORIGIN / DESTINATION</th>
                <th className="p-3">DECLARED CARGO</th>
                <th className="p-3">PERMIT STATUS</th>
                <th className="p-3">RISK LEVEL</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="font-medium divide-y" style={{ borderColor: 'rgba(185,28,28,0.1)' }}>
              {vehicles.map((v) => {
                const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'VERY HIGH';
                return (
                  <tr
                    key={v.id}
                    className="transition-colors hover:bg-red-950/20"
                    style={{
                      background: isCritical ? 'rgba(127,29,29,0.12)' : 'transparent',
                      borderBottom: '1px solid rgba(185,28,28,0.1)'
                    }}
                  >
                    <td className="p-3 font-mono-hud font-bold flex items-center space-x-2" style={{ color: '#F5E6DC' }}>
                      <span className="text-sm">🚛</span>
                      <span className="text-red-300">{v.vehicle_number}</span>
                    </td>
                    <td className="p-3 text-[11px]" style={{ color: 'rgba(245,230,220,0.7)' }}>{v.vehicle_type}</td>
                    <td className="p-3 font-mono-hud text-[10px]" style={{ color: 'rgba(217,119,6,0.75)' }}>
                      {v.current_lat.toFixed(4)}°, {v.current_lng.toFixed(4)}°
                    </td>
                    <td className="p-3 font-orbitron font-bold" style={{ color: '#EA580C' }}>{v.speed_kmh} km/h</td>
                    <td className="p-3 font-mono-hud text-[11px]" style={{ color: 'rgba(245,230,220,0.6)' }}>{v.heading_deg}°</td>
                    <td className="p-3 text-[11px]">
                      <div className="font-semibold" style={{ color: '#F5E6DC' }}>{v.origin}</div>
                      <div className="text-[9px]" style={{ color: 'rgba(217,119,6,0.5)' }}>→ {v.destination}</div>
                    </td>
                    <td className="p-3 font-orbitron font-bold" style={{ color: '#D97706' }}>{v.declared_quantity_m3} m³</td>
                    <td className="p-3">
                      {v.permit_status === 'VALID' ? (
                        <span
                          className="rounded px-2 py-0.5 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.35)' }}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          VALID
                        </span>
                      ) : (
                        <span
                          className="rounded px-2 py-0.5 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1 animate-pulse"
                          style={{ background: 'rgba(185,28,28,0.4)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.6)' }}
                        >
                          <ShieldX className="h-2.5 w-2.5" />
                          NOT FOUND
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isCritical ? (
                        <span
                          className="rounded px-2 py-0.5 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1"
                          style={{ background: 'rgba(127,29,29,0.5)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.6)' }}
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {v.risk_level}
                        </span>
                      ) : (
                        <span
                          className="rounded px-2 py-0.5 font-orbitron text-[8px] font-black uppercase"
                          style={{ background: 'rgba(28,8,0,0.8)', color: 'rgba(245,230,220,0.6)', border: '1px solid rgba(185,28,28,0.15)' }}
                        >
                          {v.risk_level}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectVehicle(v)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-orbitron text-[9px] font-bold uppercase transition-all hover:scale-105"
                        style={{
                          background: 'rgba(28,8,0,0.9)',
                          border: '1px solid rgba(234,88,12,0.4)',
                          color: '#EA580C'
                        }}
                      >
                        <span>TRACK</span>
                        <ArrowRight className="h-3 w-3" />
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
