// Mirrors backend/app/explain/plain_language.py so the UI always has a
// plain-English explanation ready instantly, even before (or without) a
// round-trip to the backend. When the backend IS reachable and has real
// satellite data, its plain_language block is used instead (see
// api/client.ts + pages/SatelliteCompare.tsx) — this is purely the
// zero-setup fallback so the app never shows raw numbers with nothing to
// explain them.

export interface PlainLanguage {
  headline: string;
  severityWord: string;
  recommendedAction: string;
  areaLostHa: number;
  areaLostPlain: string;
  whatTheColorsMean: string;
  speciesNote: string | null;
  confidenceCaveat: string;
  dataSourceNote: string;
}

const FOOTBALL_FIELD_HA = 0.714;

function areaComparison(areaLostHa: number): string {
  if (areaLostHa <= 0) return "no measurable area";
  const fields = areaLostHa / FOOTBALL_FIELD_HA;
  if (fields < 1) return `about ${Math.round(fields * 100)}% of a football field`;
  if (fields < 10) return `about ${fields.toFixed(1)} football fields`;
  if (fields < 1000) return `about ${Math.round(fields)} football fields`;
  return `about ${(fields / 1000).toFixed(1)} thousand football fields`;
}

function severity(dropPct: number, areaLostHa: number): { word: string; action: string } {
  const byDrop =
    dropPct < 3 ? 0 : dropPct < 10 ? 1 : dropPct < 25 ? 2 : dropPct < 50 ? 3 : 4;
  const byArea = areaLostHa < 2 ? 0 : areaLostHa < 8 ? 1 : areaLostHa < 20 ? 2 : areaLostHa < 50 ? 3 : 4;
  const idx = Math.max(byDrop, byArea);
  return [
    { word: "No real change", action: "Nothing to act on — this is normal week-to-week variation." },
    { word: "Slight thinning", action: "Worth a note, not an alarm. Keep watching this spot." },
    { word: "Noticeable clearing", action: "Send a field team to check — this pattern usually means people, not weather." },
    { word: "Significant deforestation", action: "This is a strong signal of illegal felling. Verify on the ground and flag it." },
    { word: "Severe clearing", action: "A large chunk of forest disappeared here. This needs an urgent site visit." },
  ][idx];
}

function colorCaption(densityAfterPct: number): string {
  if (densityAfterPct >= 80) return "Deep green in this image means thick, healthy tree cover — the forest here is doing well.";
  if (densityAfterPct >= 60) return "Mostly green with a few lighter patches — good tree cover, nothing concerning yet.";
  if (densityAfterPct >= 40) return "A mix of green and yellow-brown — the canopy is thinning out in parts of this area.";
  if (densityAfterPct >= 20) return "Mostly yellow-brown with little green — vegetation here is sparse or damaged.";
  return "Mostly brown/bare — this patch reads as cleared or bare ground, not forest.";
}

export function explainChangeLocally(params: {
  zoneName: string;
  beforeDate: string;
  afterDate: string;
  densityBeforePct: number;
  densityAfterPct: number;
  areaLostHa: number;
  valuableSpeciesLost?: string | null;
}): PlainLanguage {
  const { zoneName, beforeDate, afterDate, densityBeforePct, densityAfterPct, areaLostHa, valuableSpeciesLost } = params;
  const dropPct = Math.max(0, densityBeforePct - densityAfterPct);
  const grew = densityAfterPct > densityBeforePct + 1;

  let headline: string;
  let sev = severity(dropPct, areaLostHa);

  if (grew) {
    headline = `Good news: ${zoneName} actually looks greener on ${afterDate} than it did on ${beforeDate} — tree cover rose from about ${densityBeforePct.toFixed(0)}% to ${densityAfterPct.toFixed(0)}%. This usually just means the season changed (post-monsoon regrowth), not new planting.`;
    sev = { word: "Improved / regrew", action: "No action needed — likely seasonal regrowth." };
  } else {
    headline = `${zoneName} lost tree cover between ${beforeDate} and ${afterDate}: canopy density dropped from about ${densityBeforePct.toFixed(0)}% to ${densityAfterPct.toFixed(0)}%, which works out to roughly ${areaComparison(areaLostHa)} of forest (${areaLostHa.toFixed(2)} hectares) gone in that window.`;
  }

  return {
    headline,
    severityWord: sev.word,
    recommendedAction: sev.action,
    areaLostHa: Math.round(areaLostHa * 100) / 100,
    areaLostPlain: areaComparison(areaLostHa),
    whatTheColorsMean: colorCaption(densityAfterPct),
    speciesNote: valuableSpeciesLost
      ? `Some of the missing canopy overlaps a spot previously logged for ${valuableSpeciesLost} — that raises the chance this is commercial timber theft rather than natural dieback.`
      : null,
    confidenceCaveat:
      "This comes from satellite images, not a person on the ground. Clouds, shadows, and even a dry season can look like tree loss. Treat this as a lead to check, not final proof.",
    dataSourceNote: "DEMO MODE: this is simulated data for demonstration, not a real satellite image.",
  };
}
