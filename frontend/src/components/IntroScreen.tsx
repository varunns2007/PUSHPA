import React, { useEffect, useState, useRef } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

// Ember particle config
const EMBERS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  bottom: `${5 + Math.random() * 30}%`,
  size: `${3 + Math.random() * 6}px`,
  dur: `${2 + Math.random() * 3}s`,
  delay: `${Math.random() * 4}s`,
  opacity: 0.4 + Math.random() * 0.6,
}));

// Tree silhouette SVG path data
const TREES = [
  { x: '2%',  h: '72%', w: '80px',  delay: 0.3 },
  { x: '6%',  h: '55%', w: '60px',  delay: 0.5 },
  { x: '80%', h: '68%', w: '75px',  delay: 0.4 },
  { x: '88%', h: '52%', w: '55px',  delay: 0.6 },
  { x: '14%', h: '45%', w: '50px',  delay: 0.8 },
  { x: '72%', h: '48%', w: '52px',  delay: 0.7 },
];

type Phase = 'forest' | 'police' | 'title' | 'enter' | 'done';

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('forest');
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timerRef.current.push(t);
  };

  useEffect(() => {
    // Phase timeline:
    // 0ms  → forest phase (trees rise + embers)
    // 2200 → police phase (siren flashes)
    // 3800 → title phase (PUSHPA logo blooms)
    // 5500 → "ENTER" button appears
    addTimer(() => setPhase('police'), 2200);
    addTimer(() => setPhase('title'),  3800);
    addTimer(() => setPhase('enter'),  5500);

    return () => timerRef.current.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(onComplete, 900);
  };

  return (
    <div
      className={`intro-overlay flex flex-col items-center justify-end ${exiting ? 'intro-exit' : ''}`}
      style={{ cursor: phase === 'enter' ? 'pointer' : 'default' }}
      onClick={phase === 'enter' ? handleEnter : undefined}
    >
      {/* ── Background Image ── */}
      <div
        className="intro-bg"
        style={{ backgroundImage: `url('/pushpa_bg.jpg')` }}
      />

      {/* ── Dark gradient vignette ── */}
      <div className="intro-bg-overlay" />

      {/* ── Ember Particles ── */}
      {EMBERS.map(e => (
        <div
          key={e.id}
          className="ember-particle absolute"
          style={{
            left: e.left,
            bottom: e.bottom,
            width: e.size,
            height: e.size,
            opacity: e.opacity,
            '--dur': e.dur,
            '--delay': e.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* ── Tree Silhouettes (forest phase) ── */}
      {TREES.map((tree, i) => (
        <div
          key={i}
          className="intro-tree"
          style={{
            left: tree.x,
            width: tree.w,
            height: tree.h,
            animation: `treeRise 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${tree.delay}s both`,
            zIndex: 10,
          }}
        >
          <svg viewBox="0 0 80 200" width="100%" height="100%" preserveAspectRatio="none">
            {/* Tree trunk */}
            <rect x="32" y="140" width="16" height="60" fill="rgba(10,3,0,0.95)" />
            {/* Tree canopy layers */}
            <polygon points="40,0 10,80 70,80" fill="rgba(15,5,0,0.95)" />
            <polygon points="40,30 5,110 75,110" fill="rgba(10,3,0,0.95)" />
            <polygon points="40,65 0,140 80,140" fill="rgba(8,2,0,0.98)" />
            {/* Red glow edge */}
            <polygon points="40,0 10,80 70,80" fill="none" stroke="rgba(185,28,28,0.15)" strokeWidth="1" />
          </svg>
        </div>
      ))}

      {/* ── Police Station (police phase) ── */}
      {(phase === 'police' || phase === 'title' || phase === 'enter') && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20"
          style={{ animation: 'fadeSlideUp 0.8s ease both' }}
        >
          {/* Building */}
          <div className="relative flex flex-col items-center">
            {/* Siren lights */}
            <div className="flex gap-4 mb-2">
              <div className="police-siren-light" style={{ background: '#DC2626', animationDelay: '0s' }} />
              <div className="police-siren-light" style={{ background: '#2563EB', animationDelay: '0.4s' }} />
              <div className="police-siren-light" style={{ background: '#DC2626', animationDelay: '0.2s' }} />
            </div>

            {/* Station building silhouette */}
            <div
              className="relative"
              style={{ animation: 'policeFlash 0.8s ease-in-out infinite', borderRadius: '4px 4px 0 0' }}
            >
              <svg width="280" height="120" viewBox="0 0 280 120">
                {/* Main building */}
                <rect x="30" y="30" width="220" height="90" fill="rgba(10,3,0,0.96)" stroke="rgba(185,28,28,0.3)" strokeWidth="1" />
                {/* Roof */}
                <polygon points="20,30 140,5 260,30" fill="rgba(8,2,0,0.98)" stroke="rgba(185,28,28,0.2)" strokeWidth="1" />
                {/* Windows — lit red/amber */}
                <rect x="50" y="55" width="30" height="25" fill="rgba(217,119,6,0.25)" stroke="rgba(234,88,12,0.4)" strokeWidth="1" rx="2" />
                <rect x="125" y="55" width="30" height="25" fill="rgba(185,28,28,0.25)" stroke="rgba(185,28,28,0.4)" strokeWidth="1" rx="2" />
                <rect x="200" y="55" width="30" height="25" fill="rgba(217,119,6,0.2)" stroke="rgba(234,88,12,0.3)" strokeWidth="1" rx="2" />
                {/* Door */}
                <rect x="115" y="85" width="50" height="35" fill="rgba(10,3,0,0.95)" stroke="rgba(185,28,28,0.3)" strokeWidth="1" rx="1" />
                {/* Sign */}
                <rect x="85" y="38" width="110" height="14" fill="rgba(127,29,29,0.7)" rx="2" />
                <text x="140" y="49" textAnchor="middle" fill="rgba(252,165,165,0.9)" fontSize="9" fontFamily="monospace" fontWeight="bold">POLICE STATION</text>
                {/* Ground line */}
                <line x1="0" y1="120" x2="280" y2="120" stroke="rgba(185,28,28,0.2)" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Center ── */}
      <div className="relative z-30 flex flex-col items-center pb-20 space-y-6 w-full px-6 text-center">
        {/* Title */}
        {(phase === 'title' || phase === 'enter') && (
          <div className="space-y-3 title-bloom">
            {/* Red mara flower icon */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center shadow-2xl animate-glow-red">
                  <span className="text-4xl animate-flame">🌺</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-beacon-ring" />
              </div>
            </div>

            {/* PUSHPA title */}
            <h1
              className="font-cinzel font-black tracking-[0.3em] text-glow-red title-reveal"
              style={{
                fontSize: 'clamp(2.5rem, 10vw, 6rem)',
                background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 35%, #D97706 55%, #EA580C 75%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animationDelay: '0.15s',
              }}
            >
              PUSHPA
            </h1>

            {/* Subtitle */}
            <p
              className="font-orbitron text-xs tracking-[0.35em] uppercase animate-fade-slide-up delay-300"
              style={{ color: 'rgba(217,119,6,0.85)' }}
            >
              Predictive Unified System for Forest Protection &amp; Anti-Smuggling
            </p>

            {/* Tagline */}
            <p
              className="font-cinzel text-sm italic animate-fade-slide-up delay-400"
              style={{ color: 'rgba(252,165,165,0.6)' }}
            >
              "The jungle doesn't forgive. Neither do we."
            </p>
          </div>
        )}

        {/* Enter button */}
        {phase === 'enter' && (
          <button
            onClick={handleEnter}
            className="animate-fade-slide-up delay-500 group relative overflow-hidden px-10 py-4 rounded-xl font-orbitron font-black tracking-[0.2em] uppercase text-sm transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7F1D1D, #991B1B, #7F1D1D)',
              border: '1px solid rgba(220,38,38,0.6)',
              color: '#FCA5A5',
              boxShadow: '0 0 30px rgba(185,28,28,0.4), 0 8px 32px rgba(0,0,0,0.6)',
              animation: 'fadeSlideUp 0.55s ease 0.5s both, glowPulseRed 2s ease-in-out 1.5s infinite',
            }}
          >
            <span className="relative z-10">⚡ ENTER COMMAND CENTRE</span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.3), rgba(234,88,12,0.2), rgba(217,119,6,0.1))' }} />
          </button>
        )}

        {/* Phase indicator for early phases */}
        {(phase === 'forest' || phase === 'police') && (
          <div className="flex items-center gap-3 animate-fade-slide-up">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="font-mono-hud text-xs text-red-400/70 tracking-widest">
              {phase === 'forest' ? 'INITIALIZING FOREST SURVEILLANCE...' : 'CONNECTING POLICE NETWORK...'}
            </span>
            <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      {/* ── Ground fog gradient ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-15"
        style={{
          background: 'linear-gradient(0deg, rgba(10,3,0,0.97) 0%, rgba(10,3,0,0.5) 50%, transparent 100%)'
        }}
      />
    </div>
  );
};
