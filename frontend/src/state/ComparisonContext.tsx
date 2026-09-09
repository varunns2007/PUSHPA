import { createContext, useContext, useState, type ReactNode } from "react";

export interface ComparisonResult {
  beforeDate: string;
  afterDate: string;
  densityBefore: number;
  densityAfter: number;
  dropPct: number;
  valuableSpeciesLost: string | null;
  /** 0-1 grid of loss intensity, low-res, used to tint the 2D/3D heatmap */
  lossGrid: number[];
  gridSize: number;
}

interface ComparisonContextValue {
  comparison: ComparisonResult;
  setComparison: (c: ComparisonResult) => void;
}

function defaultLossGrid(size: number): number[] {
  const cx = size / 2, cy = size / 2;
  return Array.from({ length: size * size }, (_, i) => {
    const x = i % size, y = Math.floor(i / size);
    const d = Math.hypot(x - cx, y - cy) / Math.hypot(cx, cy);
    const noise = Math.sin(x * 1.4) * Math.cos(y * 1.1) * 0.2;
    return Math.max(0, Math.min(1, 0.55 - d * 0.5 + noise));
  });
}

const DEFAULT_COMPARISON: ComparisonResult = {
  beforeDate: "2026-01-05",
  afterDate: "2026-06-04",
  densityBefore: 82.4,
  densityAfter: 75.1,
  dropPct: 8.9,
  valuableSpeciesLost: "Red Sanders",
  lossGrid: defaultLossGrid(18),
  gridSize: 18,
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparison, setComparison] = useState<ComparisonResult>(DEFAULT_COMPARISON);
  return <ComparisonContext.Provider value={{ comparison, setComparison }}>{children}</ComparisonContext.Provider>;
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used within ComparisonProvider");
  return ctx;
}

export function generateLossGrid(size: number, severity: number, seedShift: number): number[] {
  const cx = size / 2 + (seedShift % 3) - 1, cy = size / 2 + (Math.floor(seedShift / 3) % 3) - 1;
  return Array.from({ length: size * size }, (_, i) => {
    const x = i % size, y = Math.floor(i / size);
    const d = Math.hypot(x - cx, y - cy) / Math.hypot(size / 2, size / 2);
    const noise = Math.sin((x + seedShift) * 1.4) * Math.cos((y + seedShift) * 1.1) * 0.22;
    return Math.max(0, Math.min(1, severity - d * (0.9 - severity * 0.3) + noise));
  });
}
