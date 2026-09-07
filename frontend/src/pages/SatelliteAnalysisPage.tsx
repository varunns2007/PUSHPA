import React, { useState } from 'react';
import type { SatelliteObservation, ForestArea } from '../types';
import { Satellite, Search, Layers, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

interface SatelliteAnalysisPageProps {
  forests: ForestArea[];
  onSelectForest: (f: ForestArea) => void;
}

export const SatelliteAnalysisPage: React.FC<SatelliteAnalysisPageProps> = ({ forests }) => {
  const [selectedForestId, setSelectedForestId] = useState<string>(forests[0]?.id || 'FOREST_001');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-09-03');
  const [maxCloud, setMaxCloud] = useState<number>(20.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [observation, setObservation] = useState<SatelliteObservation | null>(null);

  const forest = forests.find(f => f.id === selectedForestId) || forests[0];

  const handleSearch = async () => {
    if (!forest) return;
    setLoading(true);
    try {
      const res = await api.searchSatellite({
        forest_id: forest.id,
        latitude: forest.center_lat,
        longitude: forest.center_lng,
        start_date: startDate,
        end_date: endDate,
        max_cloud_pct: maxCloud
      });
      setObservation(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gis-glass p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Satellite className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              SATELLITE ACQUISITION & NDVI PIPELINE
            </h2>
            <p className="text-xs text-slate-400">
              Query Copernicus Sentinel-2 Level-2A imagery for selected AOI & spectral band processing
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Panel */}
        <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-4 md:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
            <Search className="h-4 w-4 mr-1.5" />
            Query Satellite Observations
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Forest AOI</label>
              <select
                value={selectedForestId}
                onChange={(e) => setSelectedForestId(e.target.value)}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none font-bold"
              >
                {forests.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 px-2.5 py-2 text-slate-100 border border-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 px-2.5 py-2 text-slate-100 border border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Max Cloud Coverage (%)</label>
              <input
                type="number"
                value={maxCloud}
                onChange={(e) => setMaxCloud(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-slate-100 border border-slate-800"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 transition-all"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>{loading ? 'QUERYING COPERNICUS...' : 'SEARCH SENTINEL-2 IMAGERY'}</span>
            </button>
          </div>
        </div>

        {/* Results & Spectral Bands */}
        <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center">
            <Layers className="h-4 w-4 mr-1.5 text-cyan-400" />
            Acquired Observation & Spectral Bands (B04 Red, B08 NIR)
          </h3>

          {observation ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 font-bold block">SATELLITE</span>
                  <span className="font-bold text-emerald-400">{observation.satellite_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">PRODUCT ID</span>
                  <span className="font-mono text-slate-300 truncate block">{observation.product_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">CLOUD COVER</span>
                  <span className="font-bold text-amber-400">{observation.cloud_coverage_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">VEGETATION COVER</span>
                  <span className="font-bold text-emerald-400">{observation.vegetation_coverage_pct}%</span>
                </div>
              </div>

              {/* NDVI Formula & Stats Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">NDVI Raster Calculation:</span>
                  <code className="text-emerald-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded">
                    NDVI = (B08 - B04) / (B08 + B04)
                  </code>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-1 text-center font-mono">
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-500 block">MIN NDVI</span>
                    <span className="font-bold text-red-400">{observation.min_ndvi}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-500 block">MAX NDVI</span>
                    <span className="font-bold text-emerald-400">{observation.max_ndvi}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-500 block">MEAN NDVI</span>
                    <span className="font-bold text-amber-400">{observation.mean_ndvi}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-500 block">MEDIAN NDVI</span>
                    <span className="font-bold text-cyan-400">{observation.median_ndvi}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 p-8 rounded-xl border border-slate-800 text-center space-y-2">
              <Satellite className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Click "SEARCH SENTINEL-2 IMAGERY" to query observation bands</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
