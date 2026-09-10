import { useEffect, useRef } from "react";

interface ForestTextureCanvasProps {
  /** 0-1 grid, row-major, 1 = full healthy canopy, 0 = bare ground */
  densityGrid: number[];
  gridSize: number;
  seed: string;
  /** draw a couple of copper "valuable species missing" markers over the
   * sparsest patches, so costly-timber loss reads differently from
   * ordinary thinning */
  flagValuableLoss?: boolean;
  className?: string;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// canopy color ramp: healthy green -> thinning gold -> bare earth
function canopyColor(density: number, rand: () => number) {
  const jitter = 0.85 + rand() * 0.3;
  if (density > 0.62) return `rgba(${60 * jitter},${140 * jitter},${95 * jitter},`;
  if (density > 0.38) return `rgba(${90 * jitter},${120 * jitter},${70 * jitter},`;
  if (density > 0.18) return `rgba(${170 * jitter},${130 * jitter},${60 * jitter},`;
  return `rgba(${140 * jitter},${70 * jitter},${45 * jitter},`;
}

export default function ForestTextureCanvas({ densityGrid, gridSize, seed, flagValuableLoss, className }: ForestTextureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800, H = 450;
    canvas.width = W;
    canvas.height = H;
    const rand = mulberry32(hashSeed(seed));

    // base soil
    const base = ctx.createRadialGradient(W / 2, H * 0.55, 40, W / 2, H * 0.55, W * 0.75);
    base.addColorStop(0, "#151f16");
    base.addColorStop(1, "#0a0f0b");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // faint winding river for orientation / realism, consistent across seeds
    ctx.strokeStyle = "rgba(70,95,110,0.28)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(60, 30);
    ctx.bezierCurveTo(200, 140, 160, 260, 340, 340);
    ctx.bezierCurveTo(440, 390, 520, 420, 700, 400);
    ctx.stroke();

    const cellW = W / gridSize;
    const cellH = H / gridSize;

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const density = densityGrid[gy * gridSize + gx] ?? 0.5;
        const cx = gx * cellW;
        const cy = gy * cellH;
        // scatter organic canopy blobs proportional to local density —
        // this is what reads as "real tree cover" instead of a flat tile
        const blobCount = Math.round(1 + density * 7);
        for (let i = 0; i < blobCount; i++) {
          const x = cx + rand() * cellW;
          const y = cy + rand() * cellH;
          const r = (3 + rand() * 7) * (0.6 + density * 0.8);
          const colorFn = canopyColor(density, rand);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, colorFn + (0.55 + rand() * 0.25) + ")");
          g.addColorStop(1, colorFn + "0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // subtle overall grain
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rand() * 0.12})`;
      ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5);
    }

    // valuable-species-loss markers: placed over the sparsest cells
    if (flagValuableLoss) {
      const cells = densityGrid
        .map((d, i) => ({ d, i }))
        .filter((c) => c.d < 0.3)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      cells.forEach((c, idx) => {
        const gx = c.i % gridSize, gy = Math.floor(c.i / gridSize);
        const x = gx * cellW + cellW / 2;
        const y = gy * cellH + cellH / 2;
        const pulse = 10 + (idx % 2) * 3;
        ctx.strokeStyle = "rgba(226,152,74,0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#e2984a";
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      });
    }
  }, [densityGrid, gridSize, seed, flagValuableLoss]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
