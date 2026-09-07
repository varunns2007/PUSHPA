import React, { useState } from 'react';
import type { Alert, ChangeEvent } from '../types';
import { 
  ShieldAlert, X, CheckCircle, Trees, 
  Truck, FileCheck, Eye, Layers, Box, Check, Flame, MapPin
} from 'lucide-react';

interface InvestigationModalProps {
  alert: Alert | null;
  changeEvent: ChangeEvent | null;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onMarkVerification: (alertId: string) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  alert,
  changeEvent,
  onClose,
  onNavigateTab,
  onMarkVerification
}) => {
  if (!alert && !changeEvent) return null;

  const [verified, setVerified] = useState(alert?.investigation_status === 'FIELD_VERIFICATION');

  const riskScore = alert?.risk_score || changeEvent?.risk_score || 91;
  const forestName = alert?.forest_name || changeEvent?.forest_name || 'Nilgiri Biosphere Reserve (Zone A)';
  const areaHa = changeEvent?.affected_area_ha || 2.73;
  const vegLossPct = changeEvent?.polygons[0]?.veg_loss_pct || 59.2;

  const factors = alert?.explainable_factors || [
    "Significant vegetation loss (59.2% drop)",
    "Persistent clearing area (2.73 ha extracted polygon)",
    "High-risk historical zone (8 prior incidents nearby)",
    "Vehicle operating within 2.3 km of clearing centroid",
    "No registered timber transport permit found",
    "Suspicious route heading to unregistered warehouse"
  ];

  const handleMark = () => {
    setVerified(true);
    if (alert) {
      onMarkVerification(alert.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-slide-up" style={{ background: 'rgba(0,0,0,0.88)' }}>
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(21,5,0,0.98) 0%, rgba(10,3,0,0.98) 100%)',
          border: '2px solid rgba(185,28,28,0.6)',
          boxShadow: '0 0 60px rgba(185,28,28,0.35)'
        }}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(127,29,29,0.5), rgba(40,3,3,0.8))',
            borderBottom: '1px solid rgba(185,28,28,0.4)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl animate-glow-red" style={{ background: 'rgba(185,28,28,0.3)', border: '1px solid rgba(220,38,38,0.6)' }}>
              <ShieldAlert className="h-6 w-6" style={{ color: '#FCA5A5' }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-orbitron text-sm font-black tracking-widest uppercase" style={{ color: '#FEE2E2' }}>
                  INVESTIGATION CASE #{changeEvent?.id || 'CHG001'}
                </h2>
                <span
                  className="rounded px-2.5 py-0.5 font-orbitron text-[9px] font-black uppercase tracking-wider animate-pulse"
                  style={{ background: 'rgba(127,29,29,0.7)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.7)' }}
                >
                  🔴 CRITICAL INVESTIGATION PRIORITY
                </span>
              </div>
              <p className="text-[10px]" style={{ color: 'rgba(217,119,6,0.7)' }}>
                Predictive illegal logging intelligence report &amp; explainable factor analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-red-950/40"
            style={{ color: 'rgba(217,119,6,0.7)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Score Banner */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl p-4"
            style={{ background: 'rgba(10,3,0,0.85)', border: '1px solid rgba(185,28,28,0.25)' }}
          >
            <div className="md:col-span-1 flex flex-col items-center justify-center md:border-r pr-4" style={{ borderColor: 'rgba(185,28,28,0.2)' }}>
              <span className="text-[9px] uppercase font-orbitron font-bold tracking-widest" style={{ color: 'rgba(217,119,6,0.7)' }}>INVESTIGATION RISK</span>
              <span className="text-4xl font-orbitron font-black my-1" style={{ color: '#DC2626' }}>{riskScore} / 100</span>
              <span
                className="text-[9px] font-orbitron font-black uppercase px-2 py-0.5 rounded"
                style={{ background: 'rgba(127,29,29,0.6)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.5)' }}
              >
                CRITICAL THRESHOLD
              </span>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'LOCATION', val: forestName, color: '#F5E6DC' },
                { label: 'AFFECTED AREA', val: `${areaHa} ha`, color: '#D97706' },
                { label: 'VEGETATION LOSS', val: `-${vegLossPct}%`, color: '#DC2626' },
                { label: 'TIMBER PERMIT', val: 'NOT FOUND', color: '#EF4444' },
              ].map(m => (
                <div key={m.label} className="p-2.5 rounded-lg" style={{ background: 'rgba(21,5,0,0.8)', border: '1px solid rgba(185,28,28,0.18)' }}>
                  <span className="text-[8px] font-orbitron font-bold uppercase tracking-widest block" style={{ color: 'rgba(217,119,6,0.6)' }}>{m.label}</span>
                  <span className="font-orbitron text-xs font-black mt-1 block truncate" style={{ color: m.color }}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Satellite Before & After Preview */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'rgba(10,3,0,0.85)', border: '1px solid rgba(185,28,28,0.2)' }}
            >
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#EA580C' }}>
                <Trees className="h-4 w-4 mr-1.5" />
                Copernicus Sentinel-2 Before vs After Satellite Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div className="h-28 rounded flex items-center justify-center relative" style={{ background: 'rgba(20,83,45,0.3)' }}>
                    <span className="text-4xl">🌳</span>
                    <span className="absolute bottom-1 right-1 font-mono-hud text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(10,3,0,0.9)', color: '#86efac', border: '1px solid rgba(34,197,94,0.4)' }}>
                      NDVI 0.76
                    </span>
                  </div>
                  <span className="text-[9px] font-orbitron font-bold mt-1.5 block uppercase" style={{ color: '#86efac' }}>01 AUG 2026 (BEFORE)</span>
                </div>

                <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.4)' }}>
                  <div className="h-28 rounded flex items-center justify-center relative" style={{ background: 'rgba(127,29,29,0.3)' }}>
                    <span className="text-4xl">🪓</span>
                    <span className="absolute bottom-1 right-1 font-mono-hud text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(10,3,0,0.9)', color: '#fca5a5', border: '1px solid rgba(185,28,28,0.5)' }}>
                      NDVI 0.31
                    </span>
                  </div>
                  <span className="text-[9px] font-orbitron font-bold mt-1.5 block uppercase" style={{ color: '#fca5a5' }}>01 SEP 2026 (AFTER)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: 'rgba(21,5,0,0.7)', border: '1px solid rgba(185,28,28,0.15)' }}>
                <div className="flex justify-between">
                  <span className="text-[10px]" style={{ color: 'rgba(217,119,6,0.7)' }}>Centroid Coordinates:</span>
                  <span className="font-mono-hud text-[10px] font-bold" style={{ color: '#F5E6DC' }}>11.5855° N, 76.5520° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px]" style={{ color: 'rgba(217,119,6,0.7)' }}>Extracted Polygon:</span>
                  <span className="font-orbitron font-bold text-[10px]" style={{ color: '#D97706' }}>CHG_POLY_001</span>
                </div>
              </div>
            </div>

            {/* Right: Why Flagged? Explainable Factors Checklist */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'rgba(10,3,0,0.85)', border: '1px solid rgba(185,28,28,0.2)' }}
            >
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#FCA5A5' }}>
                <Flame className="h-4 w-4 mr-1.5 animate-flame" style={{ color: '#EA580C' }} />
                Why Flagged? (Explainable Factor Breakdown)
              </h3>

              <div className="space-y-2">
                {factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-2.5 p-2.5 rounded-lg text-xs"
                    style={{ background: 'rgba(21,5,0,0.8)', border: '1px solid rgba(185,28,28,0.18)' }}
                  >
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#EA580C' }} />
                    <span className="font-medium text-[11px]" style={{ color: '#F5E6DC' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid rgba(185,28,28,0.2)' }}>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'SATELLITE', tab: 'satellite', icon: Eye, color: '#FCA5A5' },
                { label: 'HEATMAP',   tab: 'heatmap-3d', icon: Layers, color: '#EA580C' },
                { label: '3D FOREST', tab: '3d-forest', icon: Box, color: '#D97706' },
                { label: 'VEHICLES',  tab: 'vehicles',  icon: Truck, color: '#f59e0b' },
                { label: 'PERMITS',   tab: 'permits',   icon: FileCheck, color: '#86efac' },
              ].map(btn => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.tab}
                    onClick={() => { onClose(); onNavigateTab(btn.tab); }}
                    className="flex items-center space-x-1.5 rounded-lg px-3 py-1.5 font-orbitron text-[9px] font-bold uppercase transition-all hover:scale-105"
                    style={{
                      background: 'rgba(28,8,0,0.85)',
                      border: '1px solid rgba(185,28,28,0.25)',
                      color: btn.color
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleMark}
                disabled={verified}
                className="flex items-center space-x-1.5 rounded-xl px-4 py-2 font-orbitron text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: verified ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
                  border: verified ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(185,28,28,0.6)',
                  color: verified ? '#86efac' : '#FEE2E2',
                  boxShadow: verified ? 'none' : '0 0 20px rgba(185,28,28,0.3)'
                }}
              >
                <Check className="h-3.5 w-3.5" />
                <span>{verified ? 'MARKED FOR FIELD VERIFICATION' : 'MARK FOR FIELD VERIFICATION'}</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 font-orbitron text-[10px] font-bold transition-all hover:bg-red-950/40"
                style={{ background: 'rgba(28,8,0,0.8)', color: 'rgba(245,230,220,0.7)', border: '1px solid rgba(185,28,28,0.2)' }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
