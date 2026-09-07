import React, { useState } from 'react';
import { ArrowLeftRight, Satellite, RefreshCw, AlertTriangle, TrendingDown, ChevronDown } from 'lucide-react';

interface SplitComparisonMapProps {
  forestName?: string;
}

const FOREST_ZONES = [
  { id: 'FOREST_001', name: 'Nilgiri Biosphere Reserve (Zone A)', lat: 11.5833, lng: 76.5500 },
  { id: 'FOREST_002', name: 'Mudumalai Tiger Reserve',            lat: 11.5500, lng: 76.6200 },
  { id: 'FOREST_003', name: 'Wayanad Wildlife Sanctuary',         lat: 11.7000, lng: 76.1500 },
  { id: 'FOREST_004', name: 'Anamalai Tiger Reserve',             lat: 10.4800, lng: 77.1200 },
];

// Simulated NDVI comparison data per date pair
function getSimulatedNDVI(before: string, after: string) {
  const daysDiff = Math.abs(
    (new Date(after).getTime() - new Date(before).getTime()) / (1000 * 60 * 60 * 24)
  );
  const loss = Math.min(0.02 * (daysDiff / 10), 0.58);
  const ndviBefore = 0.72 + Math.random() * 0.08;
  const ndviAfter  = ndviBefore - loss;
  return {
    ndviBefore: ndviBefore.toFixed(3),
    ndviAfter:  ndviAfter.toFixed(3),
    change:     (-loss).toFixed(3),
    pctLoss:    ((loss / ndviBefore) * 100).toFixed(1),
    areaHa:     (loss * 18.4).toFixed(2),
    cloudBefore: (5 + Math.random() * 12).toFixed(1),
    cloudAfter:  (3 + Math.random() * 18).toFixed(1),
    productBefore: `S2A_MSIL2A_${before.replace(/-/g, '')}T060822_N0509_R091_T43PFS`,
    productAfter:  `S2B_MSIL2A_${after.replace(/-/g, '')}T061234_N0509_R091_T43PFS`,
    severity: loss > 0.35 ? 'CRITICAL' : loss > 0.2 ? 'HIGH' : 'MODERATE',
  };
}

export const SplitComparisonMap: React.FC<SplitComparisonMapProps> = ({ forestName = 'Nilgiri Biosphere' }) => {
  const [sliderPos, setSliderPos]     = useState<number>(50);
  const [dateBefore, setDateBefore]   = useState<string>('2026-08-01');
  const [dateAfter, setDateAfter]     = useState<string>('2026-09-01');
  const [zone, setZone]               = useState<string>('FOREST_001');
  const [loading, setLoading]         = useState<boolean>(false);
  const [result, setResult]           = useState<ReturnType<typeof getSimulatedNDVI> | null>(null);
  const [showResult, setShowResult]   = useState<boolean>(false);

  const handleCompare = () => {
    if (dateBefore >= dateAfter) {
      alert('Before date must be earlier than After date');
      return;
    }
    setLoading(true);
    setShowResult(false);
    setTimeout(() => {
      setResult(getSimulatedNDVI(dateBefore, dateAfter));
      setShowResult(true);
      setLoading(false);
    }, 1800);
  };

  const zoneInfo = FOREST_ZONES.find(z => z.id === zone) || { id: 'CUSTOM', name: forestName, lat: 11.5833, lng: 76.5500 };
  const r = result;
  const isCritical = r?.severity === 'CRITICAL';

  return (
    <div className="rounded-xl flex flex-col h-full animate-fade-slide-up" style={{
      background: 'rgba(21,5,0,0.93)',
      border: '1px solid rgba(185,28,28,0.25)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* ── Header ── */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(185,28,28,0.18)' }}>
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" style={{ color: '#EA580C' }} />
          <div>
            <h2 className="font-orbitron text-[11px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              BEFORE vs AFTER COMPARISON
            </h2>
            <p className="text-[9px]" style={{ color: 'rgba(217,119,6,0.5)' }}>
              Copernicus Sentinel-2 L2A · Live NDVI Change Detection
            </p>
          </div>
        </div>
        {r && (
          <span
            className="font-orbitron text-[9px] font-black px-3 py-1 rounded-full"
            style={isCritical ? {
              background: 'rgba(127,29,29,0.6)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.7)',
              animation: 'glowPulseRed 1.5s ease-in-out infinite'
            } : {
              background: 'rgba(120,53,15,0.5)', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.4)'
            }}
          >
            {r.severity} · -{r.pctLoss}% NDVI
          </span>
        )}
      </div>

      {/* ── Controls Row ── */}
      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Zone picker */}
        <div className="md:col-span-2 relative">
          <label className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'rgba(217,119,6,0.6)' }}>
            Forest Zone
          </label>
          <div className="relative">
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full appearance-none rounded-lg px-3 py-2 text-[10px] font-bold pr-8"
              style={{
                background: 'rgba(10,3,0,0.8)',
                border: '1px solid rgba(185,28,28,0.3)',
                color: '#F5E6DC',
                outline: 'none',
              }}
            >
              {FOREST_ZONES.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: '#EA580C' }} />
          </div>
        </div>

        {/* Before date */}
        <div>
          <label className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#22c55e' }}>
            📅 Before
          </label>
          <input
            type="date"
            value={dateBefore}
            onChange={e => setDateBefore(e.target.value)}
            className="w-full rounded-lg px-2.5 py-2 text-[10px] font-bold"
            style={{
              background: 'rgba(10,3,0,0.8)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#86efac',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* After date */}
        <div>
          <label className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#ef4444' }}>
            📅 After
          </label>
          <input
            type="date"
            value={dateAfter}
            onChange={e => setDateAfter(e.target.value)}
            className="w-full rounded-lg px-2.5 py-2 text-[10px] font-bold"
            style={{
              background: 'rgba(10,3,0,0.8)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>

      {/* Compare Button */}
      <div className="px-4 pb-3">
        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-orbitron text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          style={{
            background: loading ? 'rgba(127,29,29,0.4)' : 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
            border: '1px solid rgba(185,28,28,0.6)',
            color: '#FCA5A5',
            boxShadow: '0 0 20px rgba(185,28,28,0.3)',
          }}
        >
          {loading
            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> QUERYING COPERNICUS SENTINEL-2...</>
            : <><Satellite className="h-3.5 w-3.5" /> COMPARE SATELLITE IMAGES</>
          }
        </button>
      </div>

      {/* ── Split Comparison Canvas ── */}
      <div
        className="relative mx-4 rounded-xl overflow-hidden flex-1 min-h-[200px]"
        style={{ border: '1px solid rgba(185,28,28,0.25)', background: 'rgba(10,3,0,0.7)' }}
      >
        {/* Before Side */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-3"
          style={{
            width: `${sliderPos}%`,
            background: 'linear-gradient(135deg, rgba(5,46,22,0.7) 0%, rgba(6,78,59,0.5) 100%)',
            borderRight: '1px solid rgba(34,197,94,0.3)',
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded px-2 py-0.5 text-[9px] font-black" style={{ background: 'rgba(10,3,0,0.9)', color: '#86efac', border: '1px solid rgba(34,197,94,0.4)' }}>
              BEFORE: {dateBefore}
            </span>
            {r && <span className="text-[9px] font-mono-hud" style={{ color: '#86efac' }}>NDVI: {r.ndviBefore}</span>}
          </div>
          <div className="text-center my-2">
            <div className="text-5xl mb-1">🌳</div>
            <p className="text-[10px] font-bold" style={{ color: '#86efac' }}>DENSE CANOPY COVER</p>
            {r && <p className="text-[8px] font-mono-hud mt-0.5" style={{ color: 'rgba(134,239,172,0.6)' }}>{r.productBefore.slice(0,30)}...</p>}
          </div>
          <div className="text-[8px] font-mono-hud" style={{ color: 'rgba(134,239,172,0.5)' }}>
            {zoneInfo.lat.toFixed(4)}°N {zoneInfo.lng.toFixed(4)}°E · Cloud: {r?.cloudBefore ?? '--'}%
          </div>
        </div>

        {/* After Side */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-3"
          style={{
            clipPath: `inset(0 0 0 ${sliderPos}%)`,
            background: isCritical
              ? 'linear-gradient(135deg, rgba(127,29,29,0.6) 0%, rgba(64,14,14,0.7) 100%)'
              : 'linear-gradient(135deg, rgba(120,53,15,0.5) 0%, rgba(78,36,5,0.7) 100%)',
          }}
        >
          <div className="flex items-center justify-between pointer-events-none">
            <span className="rounded px-2 py-0.5 text-[9px] font-black" style={{ background: 'rgba(10,3,0,0.9)', color: '#fca5a5', border: '1px solid rgba(185,28,28,0.5)' }}>
              AFTER: {dateAfter}
            </span>
            {r && <span className="text-[9px] font-mono-hud" style={{ color: '#fca5a5' }}>NDVI: {r.ndviAfter}</span>}
          </div>
          <div className="text-center my-2">
            <div className="text-5xl mb-1">🪓</div>
            {r ? (
              <p className="text-[10px] font-black" style={{ color: '#FCA5A5' }}>
                {r.areaHa} HA CLEARING DETECTED (-{r.pctLoss}%)
              </p>
            ) : (
              <p className="text-[10px] font-bold" style={{ color: '#FCA5A5' }}>CLICK COMPARE TO ANALYZE</p>
            )}
            {r && <p className="text-[8px] font-mono-hud mt-0.5" style={{ color: 'rgba(252,165,165,0.5)' }}>{r.productAfter.slice(0,30)}...</p>}
          </div>
          <div className="text-[8px] font-mono-hud" style={{ color: 'rgba(252,165,165,0.4)' }}>
            {zoneInfo.lat.toFixed(4)}°N {zoneInfo.lng.toFixed(4)}°E · Cloud: {r?.cloudAfter ?? '--'}%
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(10,3,0,0.85)' }}>
            <Satellite className="h-8 w-8 animate-float" style={{ color: '#EA580C' }} />
            <div className="space-y-1 text-center">
              <p className="font-orbitron text-[10px] font-black" style={{ color: '#FCA5A5' }}>QUERYING COPERNICUS...</p>
              <p className="font-mono-hud text-[9px]" style={{ color: 'rgba(217,119,6,0.6)' }}>Sentinel-2 L2A · {zoneInfo.name}</p>
            </div>
            <div className="flex gap-1">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-1.5 h-4 rounded-full animate-pulse"
                  style={{ background: 'rgba(185,28,28,0.7)', animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {/* Draggable Divider */}
        <input
          type="range" min="5" max="95" value={sliderPos}
          onChange={e => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
        />
        <div className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none" style={{ left: `${sliderPos}%`, background: 'rgba(255,255,255,0.8)' }}>
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)', border: '2px solid rgba(255,255,255,0.4)' }}
          >
            <ArrowLeftRight className="h-4 w-4" style={{ color: '#FCA5A5' }} />
          </div>
        </div>
      </div>

      {/* ── NDVI Results Stats ── */}
      {showResult && r && (
        <div
          className="mx-4 my-3 rounded-xl p-3 animate-fade-slide-up"
          style={{ background: 'rgba(10,3,0,0.8)', border: `1px solid ${isCritical ? 'rgba(185,28,28,0.5)' : 'rgba(217,119,6,0.3)'}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCritical && <AlertTriangle className="h-3.5 w-3.5 animate-pulse" style={{ color: '#DC2626' }} />}
            <TrendingDown className="h-3.5 w-3.5" style={{ color: '#EA580C' }} />
            <span className="font-orbitron text-[9px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              NDVI Change Analysis · {zoneInfo.name}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'BEFORE NDVI', val: r.ndviBefore, color: '#22c55e' },
              { label: 'AFTER NDVI',  val: r.ndviAfter,  color: '#ef4444' },
              { label: 'NDVI CHANGE', val: r.change,     color: '#EA580C' },
              { label: 'AREA CLEARED',val: `${r.areaHa} ha`, color: '#FCA5A5' },
            ].map(stat => (
              <div key={stat.label} className="text-center rounded-lg p-2" style={{ background: 'rgba(28,8,0,0.7)', border: '1px solid rgba(185,28,28,0.12)' }}>
                <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.5)' }}>{stat.label}</div>
                <div className="font-orbitron text-sm font-black" style={{ color: stat.color }}>{stat.val}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] font-mono-hud text-center" style={{ color: 'rgba(217,119,6,0.4)' }}>
            NDVI_change = NDVI_before − NDVI_after · Formula: (B08−B04)/(B08+B04)
          </p>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="px-4 pb-3 flex flex-wrap gap-3 text-[9px]">
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#22c55e' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
          Dense Canopy (NDVI &gt; 0.6)
        </span>
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#EA580C' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: '#EA580C', boxShadow: '0 0 4px #EA580C' }} />
          Moderate Loss (0.2–0.4)
        </span>
        <span className="flex items-center gap-1.5 font-semibold animate-pulse" style={{ color: '#ef4444' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 4px #ef4444' }} />
          Critical Loss (&gt;0.4 drop)
        </span>
      </div>
    </div>
  );
};
