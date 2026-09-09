import { type ReactNode } from "react";

interface HUDFrameProps {
  children: ReactNode;
  label?: string;
  className?: string;
  scanline?: boolean;
}

export default function HUDFrame({ children, label, className = "", scanline = false }: HUDFrameProps) {
  return (
    <div className={`relative border border-line/70 bg-panel/40 ${className}`}>
      <Corner className="top-0 left-0 border-t border-l" />
      <Corner className="top-0 right-0 border-t border-r" />
      <Corner className="bottom-0 left-0 border-b border-l" />
      <Corner className="bottom-0 right-0 border-b border-r" />
      {label && (
        <div className="absolute -top-2.5 left-4 bg-void px-2 font-mono text-[10px] tracking-[0.2em] text-gold-500/80">
          {label}
        </div>
      )}
      {scanline && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
          <div
            className="h-24 w-full bg-gradient-to-b from-transparent via-forest-400/20 to-transparent"
            style={{ animation: "scanline 5s linear infinite" }}
          />
        </div>
      )}
      {children}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <div className={`absolute h-3 w-3 border-gold-500/60 ${className}`} />;
}
