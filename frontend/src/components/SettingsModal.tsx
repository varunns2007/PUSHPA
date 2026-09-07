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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="gis-glass w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <Settings className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">SYSTEM SETTINGS & CONFIGURATION</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Maps & API Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
              <Key className="h-4 w-4 mr-1.5" />
              Google Maps & Copernicus Credentials
            </h3>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Google Maps Platform API Key</label>
                <input
                  type="password"
                  value={formData.google_maps_api_key}
                  onChange={(e) => handleChange('google_maps_api_key', e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Stored securely in server environment runtime</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Copernicus Client ID</label>
                  <input
                    type="text"
                    value={formData.copernicus_client_id}
                    onChange={(e) => handleChange('copernicus_client_id', e.target.value)}
                    placeholder="cdse-client-id"
                    className="w-full rounded-xl bg-slate-900 px-3.5 py-2 text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Copernicus Client Secret</label>
                  <input
                    type="password"
                    value={formData.copernicus_client_secret}
                    onChange={(e) => handleChange('copernicus_client_secret', e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl bg-slate-900 px-3.5 py-2 text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configurable NDVI & Risk Thresholds */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
              <Sliders className="h-4 w-4 mr-1.5" />
              Configurable NDVI & Risk Engine Thresholds
            </h3>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Non-Veg Cutoff</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.ndvi_non_veg_threshold}
                  onChange={(e) => handleChange('ndvi_non_veg_threshold', parseFloat(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 px-3 py-2 text-slate-100 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sparse Veg Threshold</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.ndvi_sparse_threshold}
                  onChange={(e) => handleChange('ndvi_sparse_threshold', parseFloat(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 px-3 py-2 text-slate-100 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Moderate Veg Threshold</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.ndvi_moderate_threshold}
                  onChange={(e) => handleChange('ndvi_moderate_threshold', parseFloat(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 px-3 py-2 text-slate-100 border border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center">
              <Database className="h-4 w-4 mr-1.5" />
              Telemetry & Simulation Controls
            </h3>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="font-bold text-slate-200 block">Vehicle Telemetry Simulator</span>
                <span className="text-slate-400">Generate real-time vehicle movement events around forest boundaries</span>
              </div>
              <input
                type="checkbox"
                checked={formData.simulation_mode}
                onChange={(e) => handleChange('simulation_mode', e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/50"
            >
              <Save className="h-4 w-4" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
