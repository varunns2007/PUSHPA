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
      {/* Header */}
      <div className="flex items-center justify-between pushpa-panel p-4 rounded-xl border border-[#4A3022]/60">
        <div className="flex items-center space-x-2.5">
          <Satellite className="h-5 w-5 text-[#D99A4A]" />
          <div>
            <h2 className="font-title text-sm sm:text-base font-black uppercase tracking-wider text-[#F1E7D5]">
              SATELLITE ACQUISITION & SPECTRAL BAND ANALYSIS
            </h2>
            <p className="text-xs font-tactical text-[#A99A87]">
              Copernicus Sentinel-2 Level-2A surface reflectance ingestion & NDVI matrix computation
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search / Query Panel */}
        <div className="pushpa-panel rounded-xl p-4 border border-[#4A3022]/60 space-y-4 md:col-span-1">
          <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-[#D99A4A] flex items-center space-x-1.5 border-b border-[#4A3022]/40 pb-2">
            <Search className="h-3.5 w-3.5" />
            <span>QUERY SATELLITE TILES</span>
          </h3>

          <div className="space-y-3 text-xs font-tactical">
            <div>
              <label className="block text-[#A99A87] font-semibold mb-1">TARGET AOI</label>
              <select
                value={selectedForestId}
                onChange={(e) => setSelectedForestId(e.target.value)}
                className="w-full rounded-lg bg-[#12100D] px-3 py-2 text-[#F1E7D5] border border-[#4A3022] focus:border-[#D99A4A] focus:outline-none font-bold"
              >
                {forests.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#A99A87] font-semibold mb-1">START DATE</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg bg-[#12100D] px-2.5 py-1.5 text-[#F1E7D5] border border-[#4A3022]"
                />
              </div>
              <div>
                <label className="block text-[#A99A87] font-semibold mb-1">END DATE</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg bg-[#12100D] px-2.5 py-1.5 text-[#F1E7D5] border border-[#4A3022]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A99A87] font-semibold mb-1">MAX CLOUD COVER (%)</label>
              <input
                type="number"
                value={maxCloud}
                onChange={(e) => setMaxCloud(Number(e.target.value))}
                className="w-full rounded-lg bg-[#12100D] px-3 py-1.5 text-[#F1E7D5] border border-[#4A3022]"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-[#8E2B18] to-[#5C160F] py-2 text-xs font-tactical font-black uppercase text-[#F1E7D5] border border-[#D99A4A]/60 shadow-md shadow-red-950 hover:brightness-110 transition-all"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>{loading ? 'QUERYING SATELLITE TILES...' : 'SEARCH OBSERVATIONS'}</span>
            </button>
          </div>
        </div>

        {/* Results & Spectral Metadata Panel */}
        <div className="pushpa-panel rounded-xl p-4 border border-[#4A3022]/60 space-y-4 md:col-span-2">
          <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-[#D99A4A] flex items-center space-x-1.5 border-b border-[#4A3022]/40 pb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>OBSERVATION METADATA & SPECTRAL METRICS</span>
          </h3>

          {observation ? (
            <div className="space-y-4 text-xs font-tactical">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#12100D] p-2.5 rounded-lg border border-[#4A3022]/40">
                  <span className="text-[#74695D] block text-[10px] font-bold">PLATFORM</span>
                  <span className="font-bold text-[#F1E7D5] mt-0.5 block">{observation.satellite_name}</span>
                </div>
                <div className="bg-[#12100D] p-2.5 rounded-lg border border-[#4A3022]/40">
                  <span className="text-[#74695D] block text-[10px] font-bold">CLOUD COVERAGE</span>
                  <span className="font-bold text-[#D99A4A] mt-0.5 block font-mono">{observation.cloud_coverage_pct}%</span>
                </div>
                <div className="bg-[#12100D] p-2.5 rounded-lg border border-[#4A3022]/40">
                  <span className="text-[#74695D] block text-[10px] font-bold">MEAN NDVI</span>
                  <span className="font-bold text-[#718C48] mt-0.5 block font-mono">{observation.mean_ndvi}</span>
                </div>
                <div className="bg-[#12100D] p-2.5 rounded-lg border border-[#4A3022]/40">
                  <span className="text-[#74695D] block text-[10px] font-bold">VEG COVERAGE</span>
                  <span className="font-bold text-[#718C48] mt-0.5 block font-mono">{observation.vegetation_coverage_pct}%</span>
                </div>
              </div>

              <div className="bg-[#12100D] p-3 rounded-lg border border-[#4A3022]/40 text-[#A99A87] font-mono text-[11px] space-y-1">
                <div>PRODUCT_ID: <span className="text-[#F1E7D5]">{observation.product_id}</span></div>
                <div>ACQUISITION_TIMESTAMP: <span className="text-[#F1E7D5]">{observation.acquisition_date}</span></div>
                <div>SPECTRAL_RANGE: <span className="text-[#718C48]">Min {observation.min_ndvi}</span> &rarr; <span className="text-[#D99A4A]">Max {observation.max_ndvi}</span></div>
              </div>
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-center text-[#74695D] font-tactical">
              <Satellite className="h-8 w-8 mb-1.5 opacity-40" />
              <span className="text-xs uppercase tracking-wider">SELECT AOI AND EXECUTE SATELLITE QUERY</span>
              <span className="text-[10px] text-[#A99A87] mt-0.5 font-mono">B04 (Red 665nm) & B08 (NIR 842nm) matrices ready for ingestion</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
