import React, { useState } from 'react';
import type { Alert, ChangeEvent } from '../types';
import { 
  ShieldAlert, X, CheckCircle, 
  Truck, Eye, Layers, Box, Compass, Flame
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
  const confidence = (alert as unknown as { confidence?: number })?.confidence || (changeEvent as unknown as { confidence?: number })?.confidence || 95;
  const forestName = alert?.forest_name || changeEvent?.forest_name || 'Nilgiri Biosphere Reserve (Zone A)';
  const areaHa = changeEvent?.affected_area_ha || 2.73;
  const vegLossPct = changeEvent?.polygons[0]?.veg_loss_pct || 59.2;

  const factors = alert?.explainable_factors || [
    "+27 Forest disturbance severity (59.2% vegetation loss candidate)",
    "+18 Vegetation density loss (2.73 ha extracted polygon)",
    "+20 Permit anomaly (No registered transport permit in registry)",
    "+14 Route anomaly (Route leads to unregistered destination)",
    "+8 Historical hotspot (8 prior unauthorized incidents)",
    "+4 Spatial proximity (Vehicle within 2.3 km of clearing centroid)"
  ];

  const handleMark = () => {
    setVerified(true);
    if (alert) {
      onMarkVerification(alert.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="pushpa-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#8E2B18] shadow-2xl shadow-red-950/80">
        
        {/* Cinematic Header Bar */}
        <div className="flex items-center justify-between border-b border-[#4A3022] bg-[#14100C]/95 px-6 py-4">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5C160F]/60 border border-[#D52B1E]/60 text-[#D52B1E] shadow-lg shadow-[#8E2B18]/40">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="font-title text-base sm:text-lg font-black tracking-wider text-[#F1E7D5]">
                  INVESTIGATION DOSSIER #{changeEvent?.id || 'CHG001'}
                </h2>
                <span className="rounded bg-[#5C160F] px-2.5 py-0.5 text-xs font-tactical font-black text-[#F1E7D5] border border-[#D52B1E]">
                  CRITICAL INVESTIGATION PRIORITY
                </span>
              </div>
              <p className="text-xs font-tactical tracking-wider text-[#A99A87] mt-0.5">
                DECISION-SUPPORT INTELLIGENCE REPORT • EXPLAINABLE FACTOR ANALYSIS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#A99A87] hover:bg-[#2B1C14] hover:text-[#F1E7D5] transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Score Banner: Risk & Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#14100C] rounded-xl p-4 border border-[#4A3022]">
            <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-[#4A3022] pr-4">
              <span className="text-[11px] font-tactical font-bold tracking-widest text-[#A99A87] uppercase">
                INVESTIGATION RISK
              </span>
              <span className="font-title text-4xl font-black text-[#D52B1E] my-1">
                {riskScore} <span className="text-lg text-[#736758]">/ 100</span>
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[10px] font-tactical font-bold uppercase text-[#D99A4A] bg-[#2B1C14] px-2 py-0.5 rounded border border-[#8E2B18]">
                  CONFIDENCE: {confidence}%
                </span>
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0B0907]/80 p-2.5 rounded-lg border border-[#4A3022]/60">
                <span className="text-[#736758] font-tactical font-bold block">LOCATION</span>
                <span className="font-bold text-[#F1E7D5] mt-1 block truncate font-tactical">{forestName}</span>
              </div>
              <div className="bg-[#0B0907]/80 p-2.5 rounded-lg border border-[#4A3022]/60">
                <span className="text-[#736758] font-tactical font-bold block">AFFECTED AREA</span>
                <span className="font-bold text-[#D99A4A] mt-1 block font-mono">{areaHa} ha</span>
              </div>
              <div className="bg-[#0B0907]/80 p-2.5 rounded-lg border border-[#4A3022]/60">
                <span className="text-[#736758] font-tactical font-bold block">VEGETATION DECLINE</span>
                <span className="font-bold text-[#D52B1E] mt-1 block font-mono">-{vegLossPct}% drop</span>
              </div>
              <div className="bg-[#0B0907]/80 p-2.5 rounded-lg border border-[#4A3022]/60">
                <span className="text-[#736758] font-tactical font-bold block">INVESTIGATION STATUS</span>
                <span className={`font-bold mt-1 block font-tactical ${verified ? 'text-[#718C48]' : 'text-[#D99A4A]'}`}>
                  {verified ? 'FIELD DISPATCHED' : 'PENDING REVIEW'}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Timeline & Factor Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Explainable Contributing Factors */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#4A3022] pb-2">
                <Flame className="h-4 w-4 text-[#D99A4A]" />
                <h3 className="font-title text-xs font-black tracking-wider text-[#F1E7D5] uppercase">
                  EXPLAINABLE RISK CONTRIBUTIONS
                </h3>
              </div>

              <div className="space-y-2">
                {factors.map((factor, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-[#14100C] border border-[#4A3022]/50 text-xs">
                    <span className="text-[#D52B1E] font-bold font-mono">●</span>
                    <span className="text-[#F1E7D5] font-tactical font-semibold tracking-wide">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Multi-Source Evidence Dossier */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#4A3022] pb-2">
                <Compass className="h-4 w-4 text-[#D99A4A]" />
                <h3 className="font-title text-xs font-black tracking-wider text-[#F1E7D5] uppercase">
                  CORRELATED EVIDENCE DOSSIER
                </h3>
              </div>

              <div className="space-y-2.5">
                {/* Satellite Tile Evidence */}
                <div className="p-3 rounded-lg bg-[#14100C] border border-[#4A3022]/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-[#8E2B18]/30 border border-[#8E2B18]/50 text-[#D99A4A]">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F1E7D5] font-tactical">Copernicus Sentinel-2 Level-2A</h4>
                      <p className="text-[10px] text-[#A99A87] font-mono">Bands B04, B08 & SCL Masking</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onClose(); onNavigateTab('satellite'); }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2B1C14] border border-[#8E2B18] text-[11px] font-tactical font-bold text-[#D99A4A] hover:bg-[#8E2B18] hover:text-[#F1E7D5] transition-all"
                  >
                    <Eye className="h-3 w-3" />
                    <span>INSPECT</span>
                  </button>
                </div>

                {/* GPS Telemetry Evidence */}
                <div className="p-3 rounded-lg bg-[#14100C] border border-[#4A3022]/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-[#B65324]/30 border border-[#B65324]/50 text-[#D99A4A]">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F1E7D5] font-tactical">Timber Hauler TN01AB1234</h4>
                      <p className="text-[10px] text-[#A99A87] font-mono">Within 2.3 km of clearing centroid</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onClose(); onNavigateTab('vehicles'); }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2B1C14] border border-[#B65324] text-[11px] font-tactical font-bold text-[#D99A4A] hover:bg-[#B65324] hover:text-[#F1E7D5] transition-all"
                  >
                    <Eye className="h-3 w-3" />
                    <span>TRACK</span>
                  </button>
                </div>

                {/* 3D Tactical Terrain View */}
                <div className="p-3 rounded-lg bg-[#14100C] border border-[#4A3022]/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-[#5C160F]/40 border border-[#D52B1E]/40 text-[#D99A4A]">
                      <Box className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F1E7D5] font-tactical">3D Tactical Terrain Mesh</h4>
                      <p className="text-[10px] text-[#A99A87] font-mono">Topographical depression & overlay</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onClose(); onNavigateTab('3d-forest'); }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2B1C14] border border-[#D52B1E] text-[11px] font-tactical font-bold text-[#D99A4A] hover:bg-[#5C160F] hover:text-[#F1E7D5] transition-all"
                  >
                    <Eye className="h-3 w-3" />
                    <span>3D VIEW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#4A3022] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#A99A87] font-tactical">
              PUSHPA DECISION-SUPPORT • EVIDENCE DOSSIER READY FOR EXPORT
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#14100C] border border-[#4A3022] text-xs font-tactical font-bold text-[#A99A87] hover:text-[#F1E7D5] hover:border-[#D99A4A] transition-all"
              >
                CLOSE
              </button>

              <button
                onClick={handleMark}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-tactical font-black tracking-wider text-[#F1E7D5] transition-all ${
                  verified
                    ? 'bg-[#718C48] border border-[#718C48] shadow-lg shadow-emerald-950/60'
                    : 'bg-gradient-to-r from-[#8E2B18] to-[#5C160F] border border-[#D99A4A]/60 shadow-lg shadow-[#8E2B18]/50 hover:brightness-110'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{verified ? 'FIELD PATROL DISPATCHED' : 'AUTHORIZE FIELD VERIFICATION PATROL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
