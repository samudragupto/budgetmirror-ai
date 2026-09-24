/** Shared (server+client safe) chart datum helpers. */
import type { WardCategoryMetric } from "@/types/metrics";

export interface DemandBudgetDatum {
  category: string;
  short: string;
  demand: number;
  budgetShare: number;
}

export function toChartData(
  metrics: WardCategoryMetric[],
  short: (c: string) => string,
): DemandBudgetDatum[] {
  return metrics.map((m) => ({
    category: m.category,
    short: short(m.category),
    demand: m.demand_score,
    budgetShare: m.budget_share === null ? 0 : Math.round(m.budget_share * 100),
  }));
}
