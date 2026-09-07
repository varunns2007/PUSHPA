import React, { useState } from 'react';
import { Calendar, ArrowLeftRight, Layers, AlertCircle } from 'lucide-react';

interface SplitComparisonMapProps {
  forestName: string;
}

export const SplitComparisonMap: React.FC<SplitComparisonMapProps> = ({ forestName }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [dateBefore, setDateBefore] = useState<string>('2026-08-01');
  const [dateAfter, setDateAfter] = useState<string>('2026-09-01');

  return (
    <div className="pushpa-panel rounded-xl p-4 border border-[#4A3022]/60 space-y-3 h-full flex flex-col">
      {/* Header & Date Pickers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4A3022]/40 pb-3">
        <div className="flex items-center space-x-2">
          <ArrowLeftRight className="h-4 w-4 text-[#D99A4A]" />
          <div>
            <h2 className="text-xs font-tactical font-black uppercase tracking-wider text-[#F1E7D5]">
              BEFORE VS AFTER SATELLITE COMPARISON
            </h2>
            <p className="text-[11px] text-[#A99A87] font-mono">{forestName} — Copernicus Sentinel-2 Level-2A</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-tactical">
          <div className="flex items-center space-x-1.5 bg-[#12100D] px-2.5 py-1.5 rounded-lg border border-[#4A3022]/40">
            <Calendar className="h-3 w-3 text-[#718C48]" />
            <span className="text-[#A99A87]">Before:</span>
            <input
              type="date"
              value={dateBefore}
              onChange={(e) => setDateBefore(e.target.value)}
              className="bg-transparent text-[#718C48] font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-[#12100D] px-2.5 py-1.5 rounded-lg border border-[#4A3022]/40">
            <Calendar className="h-3 w-3 text-[#D52B1E]" />
            <span className="text-[#A99A87]">After:</span>
            <input
              type="date"
              value={dateAfter}
              onChange={(e) => setDateAfter(e.target.value)}
              className="bg-transparent text-[#D52B1E] font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Dual Split Satellite Comparison Canvas */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-[#4A3022]/60 bg-[#0B0907] min-h-[350px]">
        {/* Left Pane (Baseline Image Surface) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#121A11] to-[#0B0907] border-r border-[#718C48]/60 flex flex-col justify-between p-4"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-[#17130F] px-2 py-0.5 text-[10px] font-tactical font-black text-[#718C48] border border-[#718C48]">
              BASELINE: {dateBefore}
            </span>
            <span className="text-[10px] font-mono text-[#718C48]">MEAN NDVI: 0.76 (DENSE)</span>
          </div>

          <div className="text-center my-auto">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#718C48]/20 border border-[#718C48] flex items-center justify-center text-[#718C48]">
              <Layers className="h-8 w-8" />
            </div>
            <p className="text-xs font-tactical font-bold text-[#718C48] mt-2 tracking-wider uppercase">
              HEALTHY FOREST CANOPY SURFACE
            </p>
            <p className="text-[10px] text-[#A99A87] font-mono mt-0.5">S2A_MSIL2A_{dateBefore.replace(/-/g, '')}</p>
          </div>

          <div className="text-[10px] font-mono text-[#74695D]">BAND_RATIO: (B08 - B04) / (B08 + B04)</div>
        </div>

        {/* Right Pane (Current Degraded Image Surface) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#2B1C14] to-[#0B0907] flex flex-col justify-between p-4 left-0 pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <div className="flex items-center justify-between pointer-events-auto">
            <span className="rounded bg-[#17130F] px-2 py-0.5 text-[10px] font-tactical font-black text-[#D52B1E] border border-[#D52B1E]">
              OBSERVED: {dateAfter}
            </span>
            <span className="text-[10px] font-mono text-[#D52B1E]">MEAN NDVI: 0.31 (LOSS)</span>
          </div>

          <div className="text-center my-auto pointer-events-auto">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#8E2B18]/30 border border-[#D52B1E] flex items-center justify-center text-[#D52B1E]">
              <AlertCircle className="h-8 w-8 animate-pulse" />
            </div>
            <p className="text-xs font-tactical font-black text-[#D52B1E] mt-2 tracking-wider uppercase">
              2.73 HA DISTURBANCE CANDIDATE DETECTED
            </p>
            <p className="text-[10px] text-[#D99A4A] font-mono mt-0.5">-59.2% VEGETATION DENSITY DROP</p>
          </div>

          <div className="text-[10px] font-mono text-[#74695D]">S2B_MSIL2A_{dateAfter.replace(/-/g, '')}</div>
        </div>

        {/* Draggable Divider Handle */}
        <input
          type="range"
          min="5"
          max="95"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
        />

        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#D99A4A] shadow-2xl z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-[#8E2B18] border border-[#D99A4A] flex items-center justify-center shadow-lg">
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#F1E7D5]" />
          </div>
        </div>
      </div>

      {/* Legend & Spectral Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-tactical bg-[#12100D] p-2.5 rounded-lg border border-[#4A3022]/40">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-[#D52B1E] font-bold">
            <span className="h-2 w-2 rounded-full bg-[#D52B1E] mr-1"></span>
            Disturbance Candidate (ΔNDVI &le; -0.35)
          </span>
          <span className="flex items-center text-[#D99A4A] font-bold">
            <span className="h-2 w-2 rounded-full bg-[#D99A4A] mr-1"></span>
            Moderate Variation (ΔNDVI &le; -0.15)
          </span>
          <span className="flex items-center text-[#718C48] font-bold">
            <span className="h-2 w-2 rounded-full bg-[#718C48] mr-1"></span>
            Stable Canopy (ΔNDVI &ge; 0.0)
          </span>
        </div>

        <span className="font-mono text-[#A99A87] text-[10px]">
          &Delta;NDVI = NDVI_observed - NDVI_baseline
        </span>
      </div>
    </div>
  );
};
