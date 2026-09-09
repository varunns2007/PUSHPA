import { useEffect, useState } from "react";
import { REGION } from "../../data/mockData";
import type { PageId } from "../../nav";
import { NAV_ITEMS } from "../../nav";

export default function TopBar({ active }: { active: PageId }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const label = NAV_ITEMS.find((n) => n.id === active)?.label ?? "Overview";

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-line/70 bg-bark/80 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm tracking-[0.2em] text-ash-100">PUSHPA</span>
        <span className="text-line">/</span>
        <span className="font-mono text-xs tracking-[0.1em] text-gold-400">{label.toUpperCase()}</span>
      </div>
      <div className="flex items-center gap-6 font-mono text-[11px] text-ash-500">
        <span className="hidden md:inline">{REGION.name.toUpperCase()} · {REGION.code}</span>
        <span className="flex items-center gap-1.5 text-signal-400">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal-400" /> LIVE ANALYSIS
        </span>
        <span>{time.toLocaleTimeString("en-GB", { hour12: false })} IST</span>
      </div>
    </header>
  );
}
