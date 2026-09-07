import React from 'react';
import { AlertOctagon, ArrowRight, X } from 'lucide-react';

interface DemoScenarioBarProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  onNext: () => void;
  onClose: () => void;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  currentStep,
  totalSteps,
  stepName,
  onNext,
  onClose
}) => {
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="gis-glass border-b border-red-900/50 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950/40 px-4 py-2.5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/30 text-red-400 font-bold border border-red-500/50 text-xs">
            {currentStep}/{totalSteps}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                PUSHPA DEMO INCIDENT SCENARIO RUNNING
              </span>
              <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-800">
                {pct}% COMPLETE
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100 flex items-center space-x-1.5 mt-0.5">
              <span className="text-emerald-400 font-bold">Step {currentStep}:</span>
              <span>{stepName}</span>
            </p>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="hidden md:block flex-1 mx-6">
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentStep < totalSteps ? (
            <button
              onClick={onNext}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
            >
              <span>NEXT STEP</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="flex items-center space-x-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white animate-bounce">
              <AlertOctagon className="h-4 w-4 mr-1" />
              CASE #CHG001 FLAGGED (RISK 91/100)
            </span>
          )}

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            title="Exit Demo Scenario"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
