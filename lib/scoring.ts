/**
 * BudgetMirror AI — deterministic scoring engine.
 *
 * AI structures and explains; ALL money-adjacent decisions use these pure
 * functions so every score is reproducible, auditable and explainable.
 * No ML black box touches funding math.
 *
 * Formulas (see README for the plain-language version):
 *
 *  Demand (0-100) =
 *    report_count_factor * 0.35 + avg_urgency * 0.25 +
 *    community_validations * 0.15 + vulnerable_group_reports * 0.15 +
 *    unresolved_duration * 0.10
 *
 *  Alignment = max(0, round(100 - |demandShare - budgetShare| * 100))
 *
 *  Priority =
 *    0.35*demand + 0.25*fundingGap + 0.15*severity + 0.10*vulnerable +
 *    0.10*delay + 0.05*validationSignal
 *
 *  Impact =
 *    0.40*resolution + 0.25*satisfaction + 0.20*complaintReduction +
 *    0.15*onTimeInBudget
 */

import { clamp } from "./utils";
import { MISMATCH_LABELS, type MismatchLabel } from "./constants";

/* ------------------------------------------------------------------ */
/* Demand score                                                        */
/* ------------------------------------------------------------------ */

export interface DemandInputs {
  /** 0-100: volume of reports relative to ward scale */
  reportCountFactor: number;
  /** 0-100: mean urgency_score of reports */
  avgUrgency: number;
  /** 0-100: community validations / corroborations */
  communityValidations: number;
  /** 0-100: reports mentioning vulnerable groups */
  vulnerableGroupReports: number;
  /** 0-100: how long issues stay unresolved */
  unresolvedDuration: number;
}

export function computeDemandScore(i: DemandInputs): number {
  return Math.round(
    i.reportCountFactor * 0.35 +
      i.avgUrgency * 0.25 +
      i.communityValidations * 0.15 +
      i.vulnerableGroupReports * 0.15 +
      i.unresolvedDuration * 0.1,
  );
}

export interface RawReportSignal {
  urgencyScore: number;
  createdAt: string | Date;
  status: string;
  mentionsVulnerableGroup: boolean;
  validationCount: number;
}

/**
 * Build normalised 0-100 demand factors from raw report signals.
 * `scaleReports` ≈ reports that saturate the count factor for the ward
 * (default 60 — matches the Ward 5 demo story).
 */
export function demandFactorsFromReports(
  reports: RawReportSignal[],
  opts?: { scaleReports?: number; now?: Date },
): DemandInputs {
  const now = opts?.now ?? new Date();
  const scale = opts?.scaleReports ?? 60;
  if (reports.length === 0) {
    return {
      reportCountFactor: 0,
      avgUrgency: 0,
      communityValidations: 0,
      vulnerableGroupReports: 0,
      unresolvedDuration: 0,
    };
  }
  const avgUrgency =
    reports.reduce((s, r) => s + clamp(r.urgencyScore, 0, 100), 0) / reports.length;
  const validations = reports.reduce((s, r) => s + r.validationCount, 0);
  const vulnerable = reports.filter((r) => r.mentionsVulnerableGroup).length;
  const openAges = reports
    .filter((r) => r.status !== "resolved")
    .map((r) => (now.getTime() - new Date(r.createdAt).getTime()) / 86400000);
  const avgOpenDays =
    openAges.length > 0 ? openAges.reduce((s, d) => s + d, 0) / openAges.length : 0;

  return {
    reportCountFactor: clamp(Math.round((reports.length / scale) * 100), 0, 100),
    avgUrgency: Math.round(avgUrgency),
    communityValidations: clamp(validations * 4, 0, 100),
    vulnerableGroupReports: clamp(vulnerable * 10, 0, 100),
    unresolvedDuration: clamp(Math.round(avgOpenDays * 5), 0, 100),
  };
}

/* ------------------------------------------------------------------ */
/* Alignment                                                           */
/* ------------------------------------------------------------------ */

/** Shares are 0..1 fractions of ward totals. Returns 0-100 or null when N/A. */
export function computeAlignmentScore(
  demandShare: number | null,
  budgetShare: number | null,
): number | null {
  if (demandShare === null || budgetShare === null) return null;
  const gap = Math.abs(demandShare - budgetShare);
  return Math.max(0, Math.round(100 - gap * 100));
}

export function mismatchGap(
  demandShare: number | null,
  budgetShare: number | null,
): number | null {
  if (demandShare === null || budgetShare === null) return null;
  return Math.abs(demandShare - budgetShare);
}

/**
 * Mismatch label from normalised demand (0-100) and budget share (0-100 %).
 * Thresholds are deliberately coarse so the four demo archetypes read clearly.
 */
export function mismatchLabel(
  demandScore: number,
  budgetSharePct: number | null,
): MismatchLabel {
  if (budgetSharePct === null) return MISMATCH_LABELS.MONITOR;
  const highDemand = demandScore >= 60;
  const lowDemand = demandScore < 40;
  const highFunding = budgetSharePct >= 25;
  const lowFunding = budgetSharePct < 15;

  if (highDemand && lowFunding) return MISMATCH_LABELS.UNDERFUNDED;
  if (lowDemand && highFunding) return MISMATCH_LABELS.OVERSPENDING;
  if (highDemand && highFunding) return MISMATCH_LABELS.ALIGNED;
  if (lowDemand && !highFunding) return MISMATCH_LABELS.MONITOR;
  // Middle band: lean on the gap direction for a stable label.
  if (demandScore / 100 - budgetSharePct / 100 > 0.2) return MISMATCH_LABELS.UNDERFUNDED;
  if (budgetSharePct / 100 - demandScore / 100 > 0.2) return MISMATCH_LABELS.OVERSPENDING;
  return MISMATCH_LABELS.MONITOR;
}

/* ------------------------------------------------------------------ */
/* Priority recommendation score                                       */
/* ------------------------------------------------------------------ */

export interface PriorityInputs {
  demand: number; // 0-100 demand score
  fundingGap: number; // 0-100 (demandShare - budgetShare), floored at 0
  severity: number; // 0-100 avg urgency / severity
  vulnerable: number; // 0-100 vulnerable-group exposure
  delay: number; // 0-100 project delay / incompletion
  validationSignal: number; // 0-100 citizen validation volume
}

export function computePriorityScore(p: PriorityInputs): number {
  return Math.round(
    p.demand * 0.35 +
      p.fundingGap * 0.25 +
      p.severity * 0.15 +
      p.vulnerable * 0.1 +
      p.delay * 0.1 +
      p.validationSignal * 0.05,
  );
}

export function fundingGapScore(
  demandShare: number | null,
  budgetShare: number | null,
): number {
  if (demandShare === null || budgetShare === null) return 0;
  return clamp(Math.round((demandShare - budgetShare) * 100), 0, 100);
}

/* ------------------------------------------------------------------ */
/* Impact score (projects)                                             */
/* ------------------------------------------------------------------ */

export interface ImpactInputs {
  resolution: number; // 0-100 issue_resolved confirmations
  satisfaction: number; // 0-100 mean rating scaled
  complaintReduction: number; // 0-100 post-completion report drop
  onTimeInBudget: number; // 0-100 delivery discipline
}

export function computeImpactScore(i: ImpactInputs): number {
  return Math.round(
    i.resolution * 0.4 +
      i.satisfaction * 0.25 +
      i.complaintReduction * 0.2 +
      i.onTimeInBudget * 0.15,
  );
}

export function ratingToSatisfaction(avgRating1to5: number | null): number {
  if (avgRating1to5 === null) return 0;
  return clamp(Math.round(((avgRating1to5 - 1) / 4) * 100), 0, 100);
}

export function resolutionToScore(yes: number, partial: number, no: number): number {
  const total = yes + partial + no;
  if (total === 0) return 0;
  return Math.round(((yes + partial * 0.5) / total) * 100);
}

/* ------------------------------------------------------------------ */
/* Worked examples (double as documentation / sanity checks)           */
/* ------------------------------------------------------------------ *
 *
 * Ward 5 Water Supply (demo story):
 *   demandShare = 0.80, budgetShare = 0.11
 *   gap = 0.69 → alignment = max(0, round(100 - 69)) = 31 ✓
 *
 *   demand inputs: count 83 (50 reports / 60 scale), urgency 88,
 *   validations 60, vulnerable 70, duration 75
 *   → 83*.35 + 88*.25 + 60*.15 + 70*.15 + 75*.10
 *   → 29.05 + 22 + 9 + 10.5 + 7.5 = 78.05 → 78
 *   (seeded demo demand is 93 — the story's headline figure after
 *   including the full 147-report history; the function above is what
 *   live recalculation uses.)
 */
