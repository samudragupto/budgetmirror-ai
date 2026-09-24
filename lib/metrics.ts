/**
 * Ward × category metrics recalculation.
 * Reads reports + budgets, recomputes demand/alignment/priority with the
 * deterministic engine, and upserts ward_category_metrics.
 * Triggered after report insert and after budget approval.
 */
import "server-only";

import {
  computeAlignmentScore,
  computeDemandScore,
  computePriorityScore,
  demandFactorsFromReports,
  fundingGapScore,
  mismatchLabel,
} from "./scoring";

interface ReportRow {
  ward_id: string | null;
  category: string;
  urgency_score: number | null;
  created_at: string;
  status: string;
  translated_text: string | null;
  original_text: string;
}

interface BudgetRow {
  ward_id: string | null;
  category: string;
  allocated_amount: number;
  spent_amount: number;
}

export interface RecalculatedMetric {
  ward_id: string;
  category: string;
  period: string;
  demand_score: number;
  demand_share: number | null;
  budget_share: number | null;
  alignment_score: number | null;
  mismatch_score: number | null;
  priority_score: number;
  report_count: number;
  allocated_amount: number;
  spent_amount: number;
}

const VULNERABLE_HINTS = [
  "school", "children", "student", "anganwadi", "elderly", "old age",
  "patient", "hospital", "phc", "disabled", "widow", "pregnant", "स्कूल", "बच्च",
];

function mentionsVulnerable(text: string): boolean {
  const t = text.toLowerCase();
  return VULNERABLE_HINTS.some((h) => t.includes(h.toLowerCase()));
}

/** Pure recomputation — takes rows, returns metrics. Easy to test, no I/O. */
export function recalculateMetricsPure(
  reports: ReportRow[],
  budgets: BudgetRow[],
  period: string,
): RecalculatedMetric[] {
  const wards = new Set<string>();
  reports.forEach((r) => r.ward_id && wards.add(r.ward_id));
  budgets.forEach((b) => b.ward_id && wards.add(b.ward_id));

  const out: RecalculatedMetric[] = [];

  for (const wardId of wards) {
    const wReports = reports.filter((r) => r.ward_id === wardId && r.status !== "flagged");
    const wBudgets = budgets.filter((b) => b.ward_id === wardId);
    const categories = new Set<string>();
    wReports.forEach((r) => categories.add(r.category));
    wBudgets.forEach((b) => categories.add(b.category));

    // First pass: per-category demand + allocated.
    const perCat = [...categories].map((category) => {
      const cat = wReports.filter((r) => r.category === category);
      const factors = demandFactorsFromReports(
        cat.map((r) => ({
          urgencyScore: r.urgency_score ?? 50,
          createdAt: r.created_at,
          status: r.status,
          mentionsVulnerableGroup: mentionsVulnerable(
            `${r.original_text} ${r.translated_text ?? ""}`,
          ),
          validationCount: 0,
        })),
      );
      const demand = computeDemandScore(factors);
      const allocated = wBudgets
        .filter((b) => b.category === category)
        .reduce((s, b) => s + b.allocated_amount, 0);
      const spent = wBudgets
        .filter((b) => b.category === category)
        .reduce((s, b) => s + b.spent_amount, 0);
      return { category, demand, allocated, spent, count: cat.length, factors };
    });

    const totalDemand = perCat.reduce((s, c) => s + c.demand, 0);
    const totalBudget = wBudgets.reduce((s, b) => s + b.allocated_amount, 0);

    for (const c of perCat) {
      const demandShare = totalDemand > 0 ? c.demand / totalDemand : null;
      const budgetShare = totalBudget > 0 ? c.allocated / totalBudget : null;
      const alignment = computeAlignmentScore(demandShare, budgetShare);
      const gap = fundingGapScore(demandShare, budgetShare);
      const priority = computePriorityScore({
        demand: c.demand,
        fundingGap: gap,
        severity: c.factors.avgUrgency,
        vulnerable: c.factors.vulnerableGroupReports,
        delay: 0,
        validationSignal: c.factors.communityValidations,
      });
      // Label computed for read models; stored implicitly via scores.
      void mismatchLabel(c.demand, budgetShare === null ? null : Math.round(budgetShare * 100));
      out.push({
        ward_id: wardId,
        category: c.category,
        period,
        demand_score: c.demand,
        demand_share: demandShare,
        budget_share: budgetShare,
        alignment_score: alignment,
        mismatch_score:
          demandShare !== null && budgetShare !== null
            ? Math.round(Math.abs(demandShare - budgetShare) * 100)
            : null,
        priority_score: priority,
        report_count: c.count,
        allocated_amount: c.allocated,
        spent_amount: c.spent,
      });
    }
  }
  return out;
}
