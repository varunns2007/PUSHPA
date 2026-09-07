import React, { useState } from 'react';
import type { Alert, ChangeEvent } from '../types';
import { 
  ShieldAlert, X, CheckCircle, Trees, 
  Truck, FileCheck, Eye, Layers, Box, Check
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="gis-glass w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-red-900/60 shadow-2xl shadow-red-950/40">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/40 text-red-400">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-wider text-slate-100">
                  INVESTIGATION CASE #{changeEvent?.id || 'CHG001'}
                </h2>
                <span className="rounded bg-red-950 px-2.5 py-0.5 text-xs font-black text-red-400 border border-red-800">
                  🔴 CRITICAL INVESTIGATION PRIORITY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Predictive illegal logging intelligence report & explainable factor analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/90 rounded-xl p-4 border border-slate-800">
            <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-slate-800 pr-4">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">INVESTIGATION RISK</span>
              <span className="text-4xl font-black text-red-400 my-1">{riskScore} / 100</span>
              <span className="text-[10px] font-semibold uppercase text-red-500 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                CRITICAL THRESHOLD
              </span>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-semibold block">LOCATION</span>
                <span className="font-bold text-slate-200 mt-1 block truncate">{forestName}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-semibold block">AFFECTED AREA</span>
                <span className="font-bold text-amber-400 mt-1 block">{areaHa} ha</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-semibold block">VEGETATION LOSS</span>
                <span className="font-bold text-red-400 mt-1 block">{vegLossPct}%</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-semibold block">TIMBER PERMIT</span>
                <span className="font-bold text-rose-400 mt-1 block">NOT FOUND</span>
              </div>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Satellite Before & After Preview */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <Trees className="h-4 w-4 mr-1.5" />
                Copernicus Sentinel-2 Before vs After Satellite Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 text-center">
                  <div className="h-28 bg-emerald-950/60 rounded flex items-center justify-center border border-emerald-800/40 relative">
                    <span className="text-4xl">🌳</span>
                    <span className="absolute bottom-1 right-1 bg-slate-900/90 text-[9px] font-mono px-1.5 py-0.5 rounded text-emerald-400">
                      NDVI 0.76
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase">01 AUG 2026 (BEFORE)</span>
                </div>

                <div className="rounded-lg overflow-hidden border border-red-900/40 bg-slate-950 p-2 text-center">
                  <div className="h-28 bg-red-950/40 rounded flex items-center justify-center border border-red-800/40 relative">
                    <span className="text-4xl">🪓</span>
                    <span className="absolute bottom-1 right-1 bg-slate-900/90 text-[9px] font-mono px-1.5 py-0.5 rounded text-red-400">
                      NDVI 0.31
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 mt-1 block uppercase">01 SEP 2026 (AFTER)</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Centroid Coordinates:</span>
                  <span className="font-mono text-slate-200">11.5855° N, 76.5520° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Extracted Polygon:</span>
                  <span className="font-bold text-amber-400">CHG_POLY_001</span>
                </div>
              </div>
            </div>

            {/* Right: Why Flagged? Explainable Factors Checklist */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Why Flagged? (Explainable Factor Breakdown)
              </h3>

              <div className="space-y-2">
                {factors.map((f, i) => (
                  <div key={i} className="flex items-start space-x-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200 font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { onClose(); onNavigateTab('satellite'); }}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span>VIEW SATELLITE</span>
              </button>

              <button
                onClick={() => { onClose(); onNavigateTab('changes'); }}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span>VIEW HEATMAP</span>
              </button>

              <button
                onClick={() => { onClose(); onNavigateTab('3d-forest'); }}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Box className="h-3.5 w-3.5 text-cyan-400" />
                <span>VIEW 3D</span>
              </button>

              <button
                onClick={() => { onClose(); onNavigateTab('vehicles'); }}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Truck className="h-3.5 w-3.5 text-blue-400" />
                <span>VIEW VEHICLE</span>
              </button>

              <button
                onClick={() => { onClose(); onNavigateTab('permits'); }}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
              >
                <FileCheck className="h-3.5 w-3.5 text-purple-400" />
                <span>VIEW PERMIT</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleMark}
                disabled={verified}
                className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  verified
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>{verified ? 'MARKED FOR FIELD VERIFICATION' : 'MARK FOR FIELD VERIFICATION'}</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
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
