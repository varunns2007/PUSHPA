import React, { useState } from 'react';
import type { SystemSettings } from '../types';
import { Settings, X, Save, Key, Database, Sliders } from 'lucide-react';

interface SettingsModalProps {
  settings: SystemSettings;
  onSave: (newSettings: SystemSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const inputStyle = {
    background: 'rgba(10,3,0,0.85)',
    border: '1px solid rgba(185,28,28,0.25)',
    color: '#F5E6DC',
    outline: 'none',
    colorScheme: 'dark' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(21,5,0,0.98) 0%, rgba(10,3,0,0.98) 100%)',
          border: '1px solid rgba(185,28,28,0.4)',
          boxShadow: '0 0 50px rgba(185,28,28,0.25)'
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(10,3,0,0.9)', borderBottom: '1px solid rgba(185,28,28,0.25)' }}
        >
          <div className="flex items-center space-x-2.5">
            <Settings className="h-5 w-5" style={{ color: '#EA580C' }} />
            <h2 className="font-orbitron text-xs font-black tracking-widest uppercase" style={{ color: '#FCA5A5' }}>
              SYSTEM SETTINGS &amp; CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-red-950/40"
            style={{ color: 'rgba(217,119,6,0.7)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Maps & API Credentials */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#EA580C' }}>
              <Key className="h-4 w-4 mr-1.5" />
              Google Maps &amp; Copernicus Credentials
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.7)' }}>
                  Google Maps Platform API Key
                </label>
                <input
                  type="password"
                  value={formData.google_maps_api_key}
                  onChange={(e) => handleChange('google_maps_api_key', e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs font-mono-hud"
                  style={inputStyle}
                />
                <span className="text-[9px] mt-0.5 block" style={{ color: 'rgba(217,119,6,0.45)' }}>Stored securely in server environment runtime</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.7)' }}>
                    Copernicus Client ID
                  </label>
                  <input
                    type="text"
                    value={formData.copernicus_client_id}
                    onChange={(e) => handleChange('copernicus_client_id', e.target.value)}
                    placeholder="cdse-client-id"
                    className="w-full rounded-xl px-3.5 py-2 text-xs font-mono-hud"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.7)' }}>
                    Copernicus Client Secret
                  </label>
                  <input
                    type="password"
                    value={formData.copernicus_client_secret}
                    onChange={(e) => handleChange('copernicus_client_secret', e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl px-3.5 py-2 text-xs font-mono-hud"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configurable NDVI & Risk Thresholds */}
          <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(185,28,28,0.2)' }}>
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#D97706' }}>
              <Sliders className="h-4 w-4 mr-1.5" />
              Configurable NDVI &amp; Risk Engine Thresholds
            </h3>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.7)' }}>
                  Non-Veg Cutoff
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.ndvi_non_veg_threshold}
                  onChange={(e) => handleChange('ndvi_non_veg_threshold', parseFloat(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 font-mono-hud"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.7)' }}>
                  Sparse Veg Cutoff
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.ndvi_sparse_threshold}
                  onChange={(e) => handleChange('ndvi_sparse_threshold', parseFloat(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 font-mono-hud"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(217,119,6,0.7)' }}>
                  Moderate Veg Cutoff
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.ndvi_moderate_threshold}
                  onChange={(e) => handleChange('ndvi_moderate_threshold', parseFloat(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 font-mono-hud"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(185,28,28,0.2)' }}>
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: '#EA580C' }}>
              <Database className="h-4 w-4 mr-1.5" />
              Telemetry &amp; Simulation Controls
            </h3>

            <div
              className="flex items-center justify-between p-3 rounded-xl text-xs"
              style={{ background: 'rgba(10,3,0,0.7)', border: '1px solid rgba(185,28,28,0.2)' }}
            >
              <div>
                <span className="font-bold block" style={{ color: '#F5E6DC' }}>Vehicle Telemetry Simulator</span>
                <span className="text-[10px]" style={{ color: 'rgba(217,119,6,0.6)' }}>Generate real-time vehicle movement events around forest boundaries</span>
              </div>
              <input
                type="checkbox"
                checked={formData.simulation_mode}
                onChange={(e) => handleChange('simulation_mode', e.target.checked)}
                className="h-4 w-4 rounded accent-red-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4" style={{ borderTop: '1px solid rgba(185,28,28,0.2)' }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-orbitron text-[10px] font-bold transition-all hover:bg-red-950/30"
              style={{ background: 'rgba(28,8,0,0.8)', color: 'rgba(245,230,220,0.7)', border: '1px solid rgba(185,28,28,0.2)' }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl px-5 py-2 font-orbitron text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
                border: '1px solid rgba(185,28,28,0.6)',
                color: '#FEE2E2',
                boxShadow: '0 0 20px rgba(185,28,28,0.3)'
              }}
            >
              <Save className="h-3.5 w-3.5" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
