import { useEffect, useRef, useState } from "react";
import { HOTSPOTS, VEHICLES, riskColor, type Hotspot } from "../../data/mockData";

const VB_W = 1200;
const VB_H = 760;

// deterministic pseudo-random so the "satellite" texture is stable across renders
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function project(lat: number, lng: number) {
  // simple local-area linear projection for the demo region
  const x = ((lng - 77.0) / 0.12) * VB_W * 0.5 + VB_W * 0.5;
  const y = VB_H * 0.5 - ((lat - 10.35) / 0.08) * VB_H * 0.5;
  return { x, y };
}

interface ForestCanvasMapProps {
  onOpen?: () => void;
  interactive?: boolean;
  showVehicles?: boolean;
  onSelectHotspot?: (h: Hotspot) => void;
  selectedId?: string | null;
}

export default function ForestCanvasMap({
  onOpen,
  interactive = true,
  showVehicles = false,
  onSelectHotspot,
  selectedId,
}: ForestCanvasMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const dragState = useRef<{ dragging: boolean; sx: number; sy: number; ox: number; oy: number }>({
    dragging: false, sx: 0, sy: 0, ox: 0, oy: 0,
  });

  // draw procedural forest texture once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = VB_W;
    canvas.height = VB_H;

    // base earth tone
    ctx.fillStyle = "#0c130f";
    ctx.fillRect(0, 0, VB_W, VB_H);

    const rand = mulberry32(42);
    // canopy density blobs
    for (let i = 0; i < 900; i++) {
      const x = rand() * VB_W;
      const y = rand() * VB_H;
      const r = rand() * 26 + 6;
      const t = rand();
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      let c1: string, c2: string;
      if (t < 0.55) {
        c1 = "rgba(60,122,84,0.35)"; c2 = "rgba(60,122,84,0)"; // forest-500
      } else if (t < 0.8) {
        c1 = "rgba(31,77,54,0.4)"; c2 = "rgba(31,77,54,0)"; // forest-700
      } else if (t < 0.93) {
        c1 = "rgba(201,162,75,0.14)"; c2 = "rgba(201,162,75,0)"; // gold sparse clearing
      } else {
        c1 = "rgba(154,68,51,0.18)"; c2 = "rgba(154,68,51,0)"; // earth exposed soil
      }
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // river
    ctx.strokeStyle = "rgba(80,110,130,0.35)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(120, 40);
    ctx.bezierCurveTo(300, 200, 260, 400, 500, 520);
    ctx.bezierCurveTo(650, 600, 700, 680, 900, 740);
    ctx.stroke();
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    setView((v) => ({ ...v, scale: Math.min(3, Math.max(0.8, v.scale - e.deltaY * 0.001)) }));
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    dragState.current = { dragging: true, sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.sx;
    const dy = e.clientY - dragState.current.sy;
    setView((v) => ({ ...v, x: dragState.current.ox + dx, y: dragState.current.oy + dy }));
  };
  const endDrag = () => (dragState.current.dragging = false);

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden bg-void"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{ cursor: interactive ? (dragState.current.dragging ? "grabbing" : "grab") : "default" }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: "center center",
          transition: dragState.current.dragging ? "none" : "transform 0.15s ease-out",
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full">
          {/* forest boundary */}
          <polygon
            points="150,90 1050,70 1120,420 940,690 260,720 90,430"
            fill="none"
            stroke="var(--color-forest-400)"
            strokeOpacity={0.5}
            strokeDasharray="6 5"
            strokeWidth={1.5}
          />
          {/* roads */}
          <path d="M40,650 C 260,600 420,520 560,430 C 760,300 900,220 1150,150" stroke="var(--color-earth-400)" strokeOpacity={0.35} strokeWidth={2.5} fill="none" />

          {HOTSPOTS.map((h) => {
            const { x, y } = project(h.lat, h.lng);
            const isSelected = selectedId === h.id;
            if (h.valuableSpecies) {
              return (
                <g
                  key={h.id}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: onSelectHotspot ? "pointer" : "default" }}
                  onClick={() => onSelectHotspot?.(h)}
                  data-cursor-hover
                >
                  <circle r={isSelected ? 18 : 13} fill="none" stroke="var(--color-value-400)" strokeOpacity={0.55} strokeWidth={1.2}>
                    <animate attributeName="r" values={`${isSelected ? 18 : 13};${isSelected ? 25 : 19};${isSelected ? 18 : 13}`} dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <rect x={-5} y={-5} width={10} height={10} fill="var(--color-value-400)" stroke="#07090a" strokeWidth={1.5} transform="rotate(45)" />
                </g>
              );
            }
            return (
              <g
                key={h.id}
                transform={`translate(${x},${y})`}
                style={{ cursor: onSelectHotspot ? "pointer" : "default" }}
                onClick={() => onSelectHotspot?.(h)}
                data-cursor-hover
              >
                <circle r={isSelected ? 16 : 11} fill="none" stroke={riskColor(h.risk)} strokeOpacity={0.5} strokeWidth={1}>
                  <animate attributeName="r" values={`${isSelected ? 16 : 11};${isSelected ? 22 : 17};${isSelected ? 16 : 11}`} dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle r={4.5} fill={riskColor(h.risk)} stroke="#07090a" strokeWidth={1.5} />
              </g>
            );
          })}

          {showVehicles &&
            VEHICLES.map((v) => {
              const { x, y } = project(v.lat, v.lng);
              return (
                <g key={v.id} transform={`translate(${x},${y})`}>
                  <rect x={-5} y={-5} width={10} height={10} fill="var(--color-gold-500)" opacity={0.9} transform="rotate(45)" />
                  <text x={10} y={4} fontSize={12} fontFamily="JetBrains Mono" fill="var(--color-ash-300)">
                    {v.id}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {onOpen && (
        <button
          data-cursor-hover
          onClick={onOpen}
          className="absolute bottom-3 right-3 border border-gold-500/40 bg-void/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-gold-400 backdrop-blur-sm transition-colors hover:bg-gold-500/10"
        >
          OPEN FULL MAP →
        </button>
      )}

      <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] text-ash-500">
        {(10.35).toFixed(4)}°N, {(77.05).toFixed(4)}°E
      </div>
    </div>
  );
}
