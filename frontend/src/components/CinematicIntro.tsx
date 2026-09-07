import React from 'react';
import { TreePine } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = React.useState<number>(1);

  React.useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 600);
    const t2 = setTimeout(() => setStage(3), 1600);
    const t3 = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0907] overflow-hidden text-[#F1E7D5] select-none">
      {/* Background Radial Glow & Red Dust Atmospheric Simulation */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(142,43,24,0.28)_0%,rgba(11,9,7,0.98)_75%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(182,83,36,0.18)_0%,transparent_60%)] pointer-events-none" />
      
      {/* Subtle Dust particles / Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(154,128,101,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(154,128,101,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Center Cinematic Title Card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        
        {/* Top Emblem */}
        <div className={`transition-all duration-700 transform ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} mb-4`}>
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-b from-[#8E2B18]/40 to-[#2B1C14]/80 border border-[#D99A4A]/40 shadow-2xl shadow-[#8E2B18]/50">
            <TreePine className="h-8 w-8 text-[#D99A4A] animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#D52B1E] animate-ping" />
          </div>
        </div>

        {/* Cinematic Title Reveal */}
        <div className="overflow-hidden py-2">
          <h1 className={`font-title text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.25em] text-[#F1E7D5] drop-shadow-[0_4px_16px_rgba(142,43,24,0.8)] transition-all duration-1000 ${
            stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            P U S H P A
          </h1>
        </div>

        {/* Subtitle / Operational Tagline */}
        <div className={`transition-all duration-700 delay-200 mt-3 ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm font-tactical tracking-[0.3em] uppercase text-[#D99A4A] font-bold">
            <span>PREDICTIVE FOREST INTELLIGENCE</span>
            <span className="text-[#8E2B18]">•</span>
            <span>ANTI-SMUGGLING COMMAND</span>
          </div>
          <p className="text-[11px] text-[#A99A87] font-mono tracking-wider mt-2">
            COPERNICUS S2 SENTINEL • GPS TELEMETRY • PERMIT VERIFICATION
          </p>
        </div>

        {/* Loading Progress Line */}
        <div className="w-48 sm:w-64 h-[2px] bg-[#2B1C14] rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#8E2B18] via-[#D99A4A] to-[#D52B1E] animate-[pulse_1.5s_infinite] w-full" />
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 z-20 flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#14100C]/80 border border-[#9A8065]/30 text-xs font-tactical tracking-widest text-[#A99A87] hover:text-[#F1E7D5] hover:border-[#D99A4A] transition-all"
      >
        <span>ENTER COMMAND CENTER</span>
      </button>
    </div>
  );
};
