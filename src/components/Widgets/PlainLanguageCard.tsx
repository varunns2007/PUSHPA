import HUDFrame from "../HUD/HUDFrame";
import type { PlainLanguage } from "../../utils/plainLanguage";

const SEVERITY_COLOR: Record<string, string> = {
  "No real change": "text-forest-400 border-forest-400/50",
  "Slight thinning": "text-gold-400 border-gold-500/50",
  "Noticeable clearing": "text-gold-400 border-gold-500/60",
  "Significant deforestation": "text-earth-400 border-earth-500/60",
  "Severe clearing": "text-earth-400 border-earth-500/70",
  "Improved / regrew": "text-forest-400 border-forest-400/50",
};

export default function PlainLanguageCard({
  plain,
  dataSource,
  previewUrl,
}: {
  plain: PlainLanguage;
  /** "live" = real Sentinel-2 pass, "live_unavailable_fallback" | "synthetic" = demo data */
  dataSource?: string;
  /** Real true-colour satellite photo URL, only present when dataSource === "live" */
  previewUrl?: string | null;
}) {
  const badgeColor = SEVERITY_COLOR[plain.severityWord] ?? "text-ash-300 border-line/60";
  const isLive = dataSource === "live";

  return (
    <HUDFrame label="IN PLAIN WORDS" className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`border px-2 py-0.5 font-mono text-[10px] tracking-wider ${badgeColor}`}>
          {plain.severityWord.toUpperCase()}
        </span>
        <span
          className={`font-mono text-[9px] tracking-wider ${
            isLive ? "text-signal-400" : "text-ash-600"
          }`}
        >
          {isLive ? "● LIVE SATELLITE PASS" : dataSource === "live_unavailable_fallback" ? "○ NO CLEAR PASS — USING DEMO DATA" : "○ DEMO DATA"}
        </span>
      </div>

      <p className="mt-2 font-sans text-[13px] leading-relaxed text-ash-100">{plain.headline}</p>

      <div className="mt-3 border-l-2 border-gold-500/40 pl-3">
        <div className="font-mono text-[9px] tracking-wider text-ash-500">WHAT TO DO NEXT</div>
        <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-ash-300">{plain.recommendedAction}</p>
      </div>

      <div className="mt-3">
        <div className="font-mono text-[9px] tracking-wider text-ash-500">WHAT THE IMAGE IS SHOWING</div>
        <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-ash-300">{plain.whatTheColorsMean}</p>
      </div>

      {plain.speciesNote && (
        <div className="mt-3 border border-value-500/50 bg-value-600/10 p-2">
          <p className="font-mono text-[11px] leading-relaxed text-value-300">{plain.speciesNote}</p>
        </div>
      )}

      {isLive && previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          data-cursor-hover
          className="mt-3 inline-block border border-signal-400/40 bg-signal-500/10 px-3 py-1.5 font-mono text-[10px] tracking-wider text-signal-400 transition-colors hover:bg-signal-500/20"
        >
          OPEN REAL SATELLITE PHOTO →
        </a>
      )}

      <p className="mt-3 font-mono text-[10px] italic leading-relaxed text-ash-600">{plain.confidenceCaveat}</p>
    </HUDFrame>
  );
}
