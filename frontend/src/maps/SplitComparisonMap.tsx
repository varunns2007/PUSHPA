import React, { useState } from 'react';
import { Calendar, ArrowLeftRight } from 'lucide-react';

interface SplitComparisonMapProps {
  forestName: string;
}

export const SplitComparisonMap: React.FC<SplitComparisonMapProps> = ({ forestName }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [dateBefore, setDateBefore] = useState<string>('2026-08-01');
  const [dateAfter, setDateAfter] = useState<string>('2026-09-01');

  return (
    <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-4 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ArrowLeftRight className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
              BEFORE VS AFTER SATELLITE COMPARISON
            </h2>
            <p className="text-xs text-slate-400">{forestName} — Copernicus Sentinel-2 Level-2A</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Before:</span>
            <input
              type="date"
              value={dateBefore}
              onChange={(e) => setDateBefore(e.target.value)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar className="h-3.5 w-3.5 text-red-400" />
            <span className="text-slate-400">After:</span>
            <input
              type="date"
              value={dateAfter}
              onChange={(e) => setDateAfter(e.target.value)}
              className="bg-transparent text-red-400 font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Split Comparison Canvas */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[350px]">
        {/* Left Side (Before Image) */}
        <div
          className="absolute inset-0 bg-emerald-950/70 border-r border-emerald-500/50 flex flex-col justify-between p-4"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-slate-950/80 px-2.5 py-1 text-xs font-black text-emerald-400 border border-emerald-800">
              BEFORE: {dateBefore}
            </span>
            <span className="text-[11px] font-mono text-emerald-300">MEAN NDVI: 0.76 (DENSE)</span>
          </div>

          <div className="text-center">
            <span className="text-6xl">🌳</span>
            <p className="text-xs font-bold text-emerald-400 mt-2">DENSE CANOPY COVER</p>
          </div>

          <div className="text-[10px] font-mono text-slate-400">COPERNICUS_S2A_20260801_T43PFS</div>
        </div>

        {/* Right Side (After Image) */}
        <div
          className="absolute inset-0 bg-red-950/50 flex flex-col justify-between p-4 left-0 pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <div className="flex items-center justify-between pointer-events-auto">
            <span className="rounded bg-slate-950/80 px-2.5 py-1 text-xs font-black text-red-400 border border-red-800">
              AFTER: {dateAfter}
            </span>
            <span className="text-[11px] font-mono text-red-300">MEAN NDVI: 0.31 (SPARSE)</span>
          </div>

          <div className="text-center pointer-events-auto">
            <span className="text-6xl">🪓</span>
            <p className="text-xs font-black text-red-400 mt-2">2.73 HA CLEARING DETECTED (-59.2%)</p>
          </div>

          <div className="text-[10px] font-mono text-slate-400">COPERNICUS_S2B_20260901_T43PFS</div>
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
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg">
            <ArrowLeftRight className="h-4 w-4 text-slate-950 font-bold" />
          </div>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-4">
          <span className="flex items-center font-bold text-red-400">
            <span className="h-3 w-3 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
            Significant Change (-0.45 NDVI)
          </span>
          <span className="flex items-center font-bold text-amber-400">
            <span className="h-3 w-3 rounded-full bg-amber-500 mr-1.5"></span>
            Moderate Change (-0.20 NDVI)
          </span>
          <span className="flex items-center font-bold text-emerald-400">
            <span className="h-3 w-3 rounded-full bg-emerald-500 mr-1.5"></span>
            Stable Vegetation (0.00 NDVI)
          </span>
        </div>

        <span className="font-mono text-slate-400">
          NDVI_change = NDVI_previous - NDVI_current
        </span>
      </div>
    </div>
  );
};
