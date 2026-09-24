/**
 * "Civic Mirror" design tokens — the single source of truth for the
 * visual system (palettes shared between Tailwind config, charts, maps).
 */

export const civic = {
  ink: "#0B1F33",
  inkDeep: "#060F1D",
  paper: "#F4EFE6",
  paperSoft: "#FAF7F0",
  teal: "#0F766E",
  tealDeep: "#0D635D",
  coral: "#C45C26",
  gold: "#B98A2F",
  goldLight: "#D9B36A",
  slate: "#334155",
} as const;

export const chartPalette = {
  demand: civic.teal, // teal bars = citizen demand
  budget: civic.gold, // gold bars = budget share ("budget moments")
  grid: "#CBD5E1",
  axis: "#475569",
} as const;

/** Score pill tones keyed by alignment band. */
export const scoreTones = {
  green: { bg: "#DFF2EA", fg: "#0D5C46", ring: "#0F766E" },
  amber: { bg: "#F8EDD3", fg: "#7A5B12", ring: "#B98A2F" },
  orange: { bg: "#F9E3CE", fg: "#8A4416", ring: "#C45C26" },
  coral: { bg: "#F8DCD2", fg: "#8F3A17", ring: "#C45C26" },
  slate: { bg: "#E2E8F0", fg: "#334155", ring: "#64748B" },
} as const;

export type ScoreTone = keyof typeof scoreTones;

export function toneForAlignment(score: number | null): ScoreTone {
  if (score === null) return "slate";
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  if (score >= 40) return "orange";
  return "coral";
}
