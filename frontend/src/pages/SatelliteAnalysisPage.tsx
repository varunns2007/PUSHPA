import React, { useState } from 'react';
import type { SatelliteObservation, ForestArea } from '../types';
import { Satellite, Search, Layers, RefreshCw, ChevronDown, Info, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

interface SatelliteAnalysisPageProps {
  forests: ForestArea[];
  onSelectForest: (f: ForestArea) => void;
}

// Simulated result when backend is offline
function getSimulatedObservation(forest: ForestArea): SatelliteObservation {
  return {
    forest_id:             forest.id,
    satellite_name:        'Sentinel-2B',
    product_id:            `S2B_MSIL2A_20260901T061234_N0509_R091_T43PFS_${forest.code}`,
    acquisition_date:      '2026-09-01',
    cloud_coverage_pct:    8.4,
    vegetation_coverage_pct: 67.3,
    mean_ndvi:             0.61,
    max_ndvi:              0.84,
    min_ndvi:              0.12,
    median_ndvi:           0.64,
    ndvi_band_b04_url:     '',
    ndvi_band_b08_url:     '',
    ndvi_composite_url:    '',
  };
}

export const SatelliteAnalysisPage: React.FC<SatelliteAnalysisPageProps> = ({ forests }) => {
  const [selectedForestId, setSelectedForestId] = useState<string>(forests[0]?.id || 'FOREST_001');
  const [startDate, setStartDate]   = useState<string>('2026-08-01');
  const [endDate, setEndDate]       = useState<string>('2026-09-03');
  const [maxCloud, setMaxCloud]     = useState<number>(20);
  const [loading, setLoading]       = useState<boolean>(false);
  const [observation, setObservation] = useState<SatelliteObservation | null>(null);
  const [demoMode, setDemoMode]     = useState<boolean>(false);

  const forest = forests.find(f => f.id === selectedForestId) || forests[0];

  const handleSearch = async () => {
    if (!forest) return;
    setLoading(true);
    try {
      const res = await api.searchSatellite({
        forest_id:    forest.id,
        latitude:     forest.center_lat,
        longitude:    forest.center_lng,
        start_date:   startDate,
        end_date:     endDate,
        max_cloud_pct: maxCloud,
      });
      setObservation(res);
      setDemoMode(false);
    } catch {
      // Backend offline — show simulated result
      setObservation(getSimulatedObservation(forest));
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(10,3,0,0.8)',
    border: '1px solid rgba(185,28,28,0.25)',
    color: '#F5E6DC',
    outline: 'none',
    colorScheme: 'dark',
  };

  const labelStyle = { color: 'rgba(217,119,6,0.6)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', fontSize: '9px', display: 'block', marginBottom: '4px' };

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* ── Header ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.22)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl animate-glow-red" style={{ background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)' }}>
            <Satellite className="h-5 w-5" style={{ color: '#FCA5A5' }} />
          </div>
          <div>
            <h2 className="font-orbitron text-[11px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              SATELLITE ACQUISITION &amp; NDVI PIPELINE
            </h2>
            <p className="text-[9px]" style={{ color: 'rgba(217,119,6,0.55)' }}>
              Query Copernicus Sentinel-2 L2A · Spectral Band Processing · Forest AOI
            </p>
          </div>
        </div>
        {demoMode && (
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 font-orbitron text-[8px] font-black"
            style={{ background: 'rgba(120,53,15,0.5)', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.4)' }}>
            <Info className="h-3 w-3" /> SIMULATION MODE · Add API key for live data
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Query Panel ── */}
        <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" style={{ color: '#EA580C' }} />
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              Query Parameters
            </h3>
          </div>

          <div className="space-y-3">
            {/* Forest Zone */}
            <div>
              <label style={labelStyle}>Target Forest AOI</label>
              <div className="relative">
                <select
                  value={selectedForestId}
                  onChange={e => setSelectedForestId(e.target.value)}
                  className="w-full appearance-none rounded-lg px-3 py-2 text-[10px] font-bold pr-8"
                  style={inputStyle}
                >
                  {forests.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                  {forests.length === 0 && (
                    <option value="FOREST_001">Nilgiri Biosphere Reserve (NBR-001)</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#EA580C' }} />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label style={{ ...labelStyle, color: 'rgba(34,197,94,0.7)' }}>Start Date</label>
                <input
                  type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-[10px] font-bold"
                  style={{ ...inputStyle, border: '1px solid rgba(34,197,94,0.25)', color: '#86efac' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: 'rgba(239,68,68,0.7)' }}>End Date</label>
                <input
                  type="date" value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-[10px] font-bold"
                  style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                />
              </div>
            </div>

            {/* Cloud slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label style={labelStyle}>Max Cloud Cover</label>
                <span className="font-orbitron text-[10px] font-black" style={{ color: '#D97706' }}>{maxCloud}%</span>
              </div>
              <input
                type="range" min={0} max={80} value={maxCloud}
                onChange={e => setMaxCloud(Number(e.target.value))}
                className="heatmap-slider w-full"
              />
              <div className="flex justify-between text-[8px] mt-0.5" style={{ color: 'rgba(217,119,6,0.35)' }}>
                <span>Clear sky</span>
                <span>Cloudy</span>
              </div>
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-orbitron text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
                border: '1px solid rgba(185,28,28,0.6)',
                color: '#FCA5A5',
                boxShadow: '0 0 20px rgba(185,28,28,0.25)',
              }}
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Satellite className="h-3.5 w-3.5" />}
              <span>{loading ? 'QUERYING COPERNICUS...' : 'SEARCH SENTINEL-2'}</span>
            </button>

            {/* API Key hint */}
            <div className="rounded-lg p-2.5 text-[9px] space-y-0.5" style={{ background: 'rgba(10,3,0,0.7)', border: '1px solid rgba(185,28,28,0.12)' }}>
              <p className="font-bold" style={{ color: 'rgba(217,119,6,0.7)' }}>🔑 For live data:</p>
              <p style={{ color: 'rgba(217,119,6,0.45)' }}>Get free API key from</p>
              <p className="font-mono-hud font-bold" style={{ color: '#EA580C' }}>dataspace.copernicus.eu</p>
              <p style={{ color: 'rgba(217,119,6,0.45)' }}>Add to backend/app/config.py</p>
            </div>
          </div>
        </div>

        {/* ── Results Panel ── */}
        <div className="rounded-xl p-4 space-y-4 md:col-span-2" style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" style={{ color: '#D97706' }} />
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              Acquired Observation · Spectral Bands (B04 Red, B08 NIR)
            </h3>
          </div>

          {observation ? (
            <div className="space-y-4 animate-fade-slide-up">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'SATELLITE',     val: observation.satellite_name,    color: '#EA580C' },
                  { label: 'CLOUD COVER',   val: `${observation.cloud_coverage_pct}%`, color: '#D97706' },
                  { label: 'VEG COVERAGE',  val: `${observation.vegetation_coverage_pct}%`, color: '#22c55e' },
                  { label: 'ACQUIRED',      val: observation.acquisition_date,  color: '#FCA5A5' },
                ].map(m => (
                  <div key={m.label} className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(10,3,0,0.7)', border: '1px solid rgba(185,28,28,0.15)' }}>
                    <div className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(217,119,6,0.5)' }}>{m.label}</div>
                    <div className="font-orbitron text-sm font-black" style={{ color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Product ID */}
              <div className="rounded-lg px-3 py-2 font-mono-hud text-[9px] truncate" style={{ background: 'rgba(10,3,0,0.7)', border: '1px solid rgba(185,28,28,0.12)', color: 'rgba(217,119,6,0.5)' }}>
                📡 {observation.product_id}
              </div>

              {/* NDVI formula + stats */}
              <div className="rounded-xl p-3.5 space-y-3" style={{ background: 'rgba(10,3,0,0.8)', border: '1px solid rgba(185,28,28,0.18)' }}>
                <div className="flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: '1px solid rgba(185,28,28,0.15)', paddingBottom: '10px' }}>
                  <span className="text-[10px] font-bold" style={{ color: '#F5E6DC' }}>NDVI Raster Calculation:</span>
                  <code className="font-mono-hud text-[10px] px-2.5 py-1 rounded-lg font-bold"
                    style={{ background: 'rgba(28,8,0,0.9)', color: '#EA580C', border: '1px solid rgba(185,28,28,0.25)' }}>
                    NDVI = (B08 − B04) / (B08 + B04)
                  </code>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'MIN NDVI',  val: observation.min_ndvi,    color: '#ef4444' },
                    { label: 'MAX NDVI',  val: observation.max_ndvi,    color: '#22c55e' },
                    { label: 'MEAN NDVI', val: observation.mean_ndvi,   color: '#D97706' },
                    { label: 'MEDIAN',    val: observation.median_ndvi, color: '#EA580C' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(28,8,0,0.7)', border: '1px solid rgba(185,28,28,0.12)' }}>
                      <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.5)' }}>{s.label}</div>
                      <div className="font-orbitron text-base font-black" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert if low NDVI */}
              {Number(observation.mean_ndvi) < 0.45 && (
                <div className="flex items-center gap-2.5 rounded-xl p-3 animate-siren-flash" style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(185,28,28,0.5)' }}>
                  <AlertTriangle className="h-4 w-4 animate-pulse" style={{ color: '#DC2626' }} />
                  <div>
                    <p className="font-orbitron text-[9px] font-black" style={{ color: '#FCA5A5' }}>LOW VEGETATION ALERT</p>
                    <p className="text-[8px]" style={{ color: 'rgba(252,165,165,0.7)' }}>Mean NDVI {observation.mean_ndvi} indicates significant vegetation stress or deforestation.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 space-y-3 rounded-xl" style={{ background: 'rgba(10,3,0,0.5)', border: '1px dashed rgba(185,28,28,0.2)' }}>
              <Satellite className="h-12 w-12 animate-float" style={{ color: 'rgba(185,28,28,0.3)' }} />
              <div className="text-center space-y-1">
                <p className="font-orbitron text-[10px] font-bold" style={{ color: 'rgba(252,165,165,0.5)' }}>
                  AWAITING SATELLITE QUERY
                </p>
                <p className="text-[9px]" style={{ color: 'rgba(217,119,6,0.35)' }}>
                  Select a forest zone, pick dates, then click SEARCH SENTINEL-2
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
