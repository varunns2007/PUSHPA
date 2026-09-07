import React, { useState } from 'react';
import type { ChangeEvent, ForestArea, ChangePolygon } from '../types';
import { Layers, Play } from 'lucide-react';
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
      <div className="flex flex-wrap items-center justify-between gap-3 gis-glass p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              FOREST CHANGE & POLYGON EXTRACTION PIPELINE
            </h2>
            <p className="text-xs text-slate-400">
              Extract contiguous vegetation-loss polygons from Sentinel-2 NDVI difference rasters
            </p>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={loading}
          className="flex items-center space-x-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 shadow-lg shadow-amber-900/50 transition-all"
        >
          <Play className="h-4 w-4" />
          <span>{loading ? 'PROCESSING...' : 'RUN CHANGE DETECTION PIPELINE'}</span>
        </button>
      </div>

      {/* Extracted Polygons Table */}
      <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          EXTRACTED CHANGE POLYGONS ({currentChange?.polygons?.length || 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Polygon ID</th>
                <th className="p-3">Centroid Location</th>
                <th className="p-3">Area (ha)</th>
                <th className="p-3">NDVI Before</th>
                <th className="p-3">NDVI After</th>
                <th className="p-3">Veg Loss %</th>
                <th className="p-3">Severity</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {currentChange?.polygons?.map((poly) => (
                <tr key={poly.id} className="hover:bg-slate-900/90 transition-colors">
                  <td className="p-3 font-mono font-bold text-red-400">{poly.id}</td>
                  <td className="p-3 font-mono text-slate-300">
                    {poly.centroid_lat.toFixed(4)}° N, {poly.centroid_lng.toFixed(4)}° E
                  </td>
                  <td className="p-3 font-bold text-amber-400">{poly.area_ha} ha</td>
                  <td className="p-3 font-mono text-emerald-400">{poly.mean_ndvi_before}</td>
                  <td className="p-3 font-mono text-red-400">{poly.mean_ndvi_after}</td>
                  <td className="p-3 font-bold text-red-400">-{poly.veg_loss_pct}%</td>
                  <td className="p-3">
                    <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-800">
                      🔴 {poly.severity}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectPolygon(poly)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                    >
                      INSPECT CASE
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
