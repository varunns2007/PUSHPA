import React from 'react';
import { ArrowRight, X, Flame } from 'lucide-react';

interface DemoScenarioBarProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  onNext: () => void;
  onClose: () => void;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  currentStep, totalSteps, stepName, onNext, onClose
}) => {
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div
      className="px-4 py-2.5 shadow-xl animate-fade-slide-up"
      style={{
        background: 'linear-gradient(90deg, rgba(10,3,0,0.98) 0%, rgba(28,8,0,0.98) 50%, rgba(127,29,29,0.2) 100%)',
        borderBottom: '1px solid rgba(185,28,28,0.35)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Step indicator + label */}
        <div className="flex items-center space-x-3">
          {/* Step counter */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full font-orbitron text-[10px] font-black flex-shrink-0"
            style={{
              background: 'rgba(127,29,29,0.5)',
              border: '1px solid rgba(185,28,28,0.6)',
              color: '#FCA5A5',
              boxShadow: '0 0 10px rgba(185,28,28,0.3)',
            }}
          >
            {currentStep}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Flame className="h-3 w-3 animate-flame" style={{ color: '#EA580C' }} />
              <span className="font-orbitron text-[9px] font-black uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
                PUSHPA DEMO INCIDENT SCENARIO
              </span>
              <span
                className="rounded px-2 py-0.5 font-orbitron text-[8px] font-black"
                style={{
                  background: 'rgba(127,29,29,0.5)',
                  color: '#EA580C',
                  border: '1px solid rgba(185,28,28,0.4)',
                }}
              >
                {pct}%
              </span>
            </div>
            <p className="text-[11px] font-semibold flex items-center space-x-1.5 mt-0.5" style={{ color: '#F5E6DC' }}>
              <span className="font-bold" style={{ color: '#EA580C' }}>Step {currentStep}:</span>
              <span>{stepName}</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="hidden md:block flex-1 mx-6">
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(28,8,0,0.8)', border: '1px solid rgba(185,28,28,0.2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #7F1D1D, #B91C1C, #EA580C, #D97706)',
                boxShadow: '0 0 8px rgba(234,88,12,0.5)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[8px] font-mono-hud" style={{ color: 'rgba(217,119,6,0.35)' }}>
            <span>INIT</span>
            <span style={{ color: 'rgba(217,119,6,0.5)' }}>Step {currentStep} / {totalSteps}</span>
            <span>COMPLETE</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {currentStep < totalSteps ? (
            <button
              onClick={onNext}
              className="flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black transition-all hover:scale-105 active:scale-95 font-orbitron"
              style={{
                background: 'linear-gradient(135deg, #7F1D1D, #991B1B)',
                border: '1px solid rgba(185,28,28,0.5)',
                color: '#FCA5A5',
                boxShadow: '0 2px 12px rgba(185,28,28,0.35)',
              }}
            >
              <span>NEXT</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span
              className="flex items-center space-x-1.5 rounded-lg px-3 py-1.5 font-orbitron text-[9px] font-black animate-glow-red"
              style={{
                background: 'rgba(127,29,29,0.6)',
                border: '1px solid rgba(185,28,28,0.7)',
                color: '#FCA5A5',
              }}
            >
              <Flame className="h-3.5 w-3.5 animate-flame" style={{ color: '#EA580C' }} />
              <span>CASE #CHG001 · RISK 91/100</span>
            </span>
          )}

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-all hover:scale-110"
            style={{ color: 'rgba(185,28,28,0.5)', border: '1px solid rgba(185,28,28,0.15)', background: 'rgba(10,3,0,0.6)' }}
            title="Exit Demo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
