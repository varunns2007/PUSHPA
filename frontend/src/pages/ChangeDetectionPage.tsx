import React, { useState } from 'react';
import type { ChangeEvent, ForestArea, ChangePolygon } from '../types';
import { Layers, Play, Eye } from 'lucide-react';
import { api } from '../api/client';

interface ChangeDetectionPageProps {
  forests: ForestArea[];
  changes: ChangeEvent[];
  onSelectPolygon: (poly: ChangePolygon) => void;
}

export const ChangeDetectionPage: React.FC<ChangeDetectionPageProps> = ({
  forests,
  changes,
  onSelectPolygon
}) => {
  const [selectedForestId] = useState<string>(forests[0]?.id || 'FOREST_001');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentChange, setCurrentChange] = useState<ChangeEvent | null>(changes[0] || null);

  const handleProcess = async () => {
    setLoading(true);
    try {
      const res = await api.processChange({
        forest_id: selectedForestId,
        date_before: '2026-08-01',
        date_after: '2026-09-01'
      });
      setCurrentChange(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pushpa-panel p-4 rounded-xl border border-[#4A3022]/60">
        <div className="flex items-center space-x-2.5">
          <Layers className="h-5 w-5 text-[#D99A4A]" />
          <div>
            <h2 className="font-title text-sm sm:text-base font-black uppercase tracking-wider text-[#F1E7D5]">
              FOREST DISTURBANCE & POLYGON EXTRACTION
            </h2>
            <p className="text-xs font-tactical text-[#A99A87]">
              Continuous vegetation change extraction from Sentinel-2 &Delta;NDVI rasters
            </p>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={loading}
          className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-[#8E2B18] to-[#5C160F] px-4 py-2 text-xs font-tactical font-black uppercase text-[#F1E7D5] border border-[#D99A4A]/60 shadow-md shadow-red-950 hover:brightness-110 transition-all"
        >
          <Play className="h-3.5 w-3.5 fill-[#F1E7D5]" />
          <span>{loading ? 'PROCESSING RASTERS...' : 'RUN EXTRACTION PIPELINE'}</span>
        </button>
      </div>

      {/* Extracted Polygons Table */}
      <div className="pushpa-panel rounded-xl p-4 border border-[#4A3022]/60 space-y-3">
        <div className="flex items-center justify-between border-b border-[#4A3022]/40 pb-2.5">
          <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-[#F1E7D5]">
            EXTRACTED DISTURBANCE POLYGONS ({currentChange?.polygons?.length || 0})
          </h3>
          <span className="text-[10px] text-[#A99A87] font-mono">
            MIN_AREA &ge; 0.05 ha • PROJECTED GEODESIC METRIC
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-tactical border-collapse">
            <thead>
              <tr className="border-b border-[#4A3022]/60 bg-[#12100D] text-[#A99A87] font-bold uppercase text-[10px]">
                <th className="p-2.5">POLYGON ID</th>
                <th className="p-2.5">CENTROID</th>
                <th className="p-2.5">AREA (HA)</th>
                <th className="p-2.5">BASELINE NDVI</th>
                <th className="p-2.5">CURRENT NDVI</th>
                <th className="p-2.5">LOSS %</th>
                <th className="p-2.5">SEVERITY</th>
                <th className="p-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4A3022]/30 font-medium">
              {currentChange?.polygons?.map((poly) => (
                <tr key={poly.id} className="hover:bg-[#1D1813] transition-colors">
                  <td className="p-2.5 font-mono font-bold text-[#D99A4A]">{poly.id}</td>
                  <td className="p-2.5 font-mono text-[#A99A87]">
                    {poly.centroid_lat.toFixed(4)}° N, {poly.centroid_lng.toFixed(4)}° E
                  </td>
                  <td className="p-2.5 font-bold text-[#D99A4A] font-mono">{poly.area_ha} ha</td>
                  <td className="p-2.5 font-mono text-[#718C48]">{poly.mean_ndvi_before}</td>
                  <td className="p-2.5 font-mono text-[#D52B1E]">{poly.mean_ndvi_after}</td>
                  <td className="p-2.5 font-bold text-[#D52B1E] font-mono">-{poly.veg_loss_pct}%</td>
                  <td className="p-2.5">
                    <span className="rounded bg-[#5C160F] px-2 py-0.5 text-[10px] font-black text-[#F1E7D5] border border-[#D52B1E]">
                      ● {poly.severity}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => onSelectPolygon(poly)}
                      className="flex items-center space-x-1 ml-auto rounded bg-[#1D1813] border border-[#4A3022] px-2.5 py-1 text-[11px] font-bold text-[#D99A4A] hover:bg-[#8E2B18] hover:text-[#F1E7D5] transition-all"
                    >
                      <Eye className="h-3 w-3" />
                      <span>INSPECT</span>
                    </button>
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
