import React, { useState } from 'react';
import type { ChangeEvent, ForestArea, ChangePolygon } from '../types';
import { Layers, Play, AlertOctagon, Crosshair, ArrowRight } from 'lucide-react';
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
  const [selectedForestId, setSelectedForestId] = useState<string>(forests[0]?.id || 'FOREST_001');
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

  const polygons = currentChange?.polygons || [];

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.25)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl animate-glow-orange" style={{ background: 'linear-gradient(135deg, #7F1D1D, #EA580C)' }}>
            <Layers className="h-5 w-5" style={{ color: '#FEE2E2' }} />
          </div>
          <div>
            <h2 className="font-orbitron text-xs font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              FOREST CHANGE &amp; POLYGON EXTRACTION PIPELINE
            </h2>
            <p className="text-[10px]" style={{ color: 'rgba(217,119,6,0.6)' }}>
              Extract contiguous vegetation-loss polygons from Sentinel-2 NDVI difference rasters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedForestId}
            onChange={(e) => setSelectedForestId(e.target.value)}
            className="rounded-lg px-3 py-2 text-[10px] font-bold"
            style={{
              background: 'rgba(10,3,0,0.85)',
              border: '1px solid rgba(185,28,28,0.3)',
              color: '#F5E6DC',
              colorScheme: 'dark',
              outline: 'none'
            }}
          >
            {forests.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>

          <button
            onClick={handleProcess}
            disabled={loading}
            className="flex items-center space-x-2 rounded-xl px-4 py-2.5 font-orbitron text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
              border: '1px solid rgba(185,28,28,0.6)',
              color: '#FEE2E2',
              boxShadow: '0 0 20px rgba(185,28,28,0.3)'
            }}
          >
            <Play className="h-3.5 w-3.5" />
            <span>{loading ? 'ANALYZING RASTERS...' : 'RUN CHANGE DETECTION PIPELINE'}</span>
          </button>
        </div>
      </div>

      {/* Extracted Polygons Table */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(21,5,0,0.9)', border: '1px solid rgba(185,28,28,0.2)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" style={{ color: '#EA580C' }} />
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              EXTRACTED CHANGE POLYGONS ({polygons.length})
            </h3>
          </div>
          <span className="font-mono-hud text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(127,29,29,0.3)', color: '#FCA5A5', border: '1px solid rgba(185,28,28,0.3)' }}>
            AUTOMATIC VECTORIZATION ACTIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="text-[9px] font-orbitron font-bold uppercase tracking-wider"
                style={{ background: 'rgba(10,3,0,0.85)', color: 'rgba(217,119,6,0.6)', borderBottom: '1px solid rgba(185,28,28,0.2)' }}
              >
                <th className="p-3">POLYGON ID</th>
                <th className="p-3">CENTROID LOCATION</th>
                <th className="p-3">AREA (HA)</th>
                <th className="p-3">NDVI BEFORE</th>
                <th className="p-3">NDVI AFTER</th>
                <th className="p-3">VEG LOSS %</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="font-medium divide-y" style={{ borderColor: 'rgba(185,28,28,0.1)' }}>
              {polygons.map((poly) => (
                <tr
                  key={poly.id}
                  className="transition-colors hover:bg-red-950/20"
                  style={{ borderBottom: '1px solid rgba(185,28,28,0.1)' }}
                >
                  <td className="p-3 font-mono-hud font-bold" style={{ color: '#EF4444' }}>{poly.id}</td>
                  <td className="p-3 font-mono-hud text-[11px]" style={{ color: 'rgba(245,230,220,0.8)' }}>
                    {poly.centroid_lat.toFixed(4)}° N, {poly.centroid_lng.toFixed(4)}° E
                  </td>
                  <td className="p-3 font-orbitron font-bold" style={{ color: '#D97706' }}>{poly.area_ha} ha</td>
                  <td className="p-3 font-mono-hud font-bold" style={{ color: '#22c55e' }}>{poly.mean_ndvi_before}</td>
                  <td className="p-3 font-mono-hud font-bold" style={{ color: '#EF4444' }}>{poly.mean_ndvi_after}</td>
                  <td className="p-3 font-orbitron font-black" style={{ color: '#DC2626' }}>-{poly.veg_loss_pct}%</td>
                  <td className="p-3">
                    <span
                      className="rounded px-2 py-0.5 font-orbitron text-[8px] font-black uppercase inline-flex items-center gap-1"
                      style={{
                        background: 'rgba(127,29,29,0.4)',
                        color: '#FCA5A5',
                        border: '1px solid rgba(185,28,28,0.5)'
                      }}
                    >
                      <AlertOctagon className="h-2.5 w-2.5" />
                      {poly.severity}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectPolygon(poly)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-orbitron text-[9px] font-bold uppercase transition-all hover:scale-105"
                      style={{
                        background: 'rgba(28,8,0,0.9)',
                        border: '1px solid rgba(234,88,12,0.4)',
                        color: '#EA580C'
                      }}
                    >
                      <span>INSPECT</span>
                      <ArrowRight className="h-3 w-3" />
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
