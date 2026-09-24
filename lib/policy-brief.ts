/**
 * Downloadable policy summary (Markdown) built from deterministic
 * metrics + recommendations. Pure function — the client turns it into
 * a .md download; print CSS handles paper output.
 */
import type { WardCategoryMetric, Recommendation } from "@/types/metrics";
import { formatINR } from "./utils";

export function buildPolicyBrief(input: {
  period: string;
  generatedAt: string;
  metrics: WardCategoryMetric[];
  recommendations: Recommendation[];
  wardFilter?: string;
}): string {
  const { period, generatedAt, metrics, recommendations, wardFilter } = input;
  const rows = wardFilter ? metrics.filter((m) => m.ward_id === wardFilter) : metrics;
  const recs = wardFilter ? recommendations.filter((r) => r.ward_id === wardFilter) : recommendations;

  const lines: string[] = [];
  lines.push(`# BudgetMirror AI — Policy Brief (${period})`);
  lines.push(`_Generated ${generatedAt}. Decision-support only. Final funding decisions remain with authorized officials._`);
  lines.push("");
  lines.push("## Headline mismatches");
  const critical = [...rows].sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)).slice(0, 5);
  if (critical.length === 0) lines.push("- No metrics available for this selection.");
  for (const m of critical) {
    lines.push(
      `- **${m.ward_name} · ${m.category}** — demand ${m.demand_score}/100, budget share ${pct(m.budget_share)}, alignment ${m.alignment_score ?? "N/A"}, priority ${m.priority_score ?? "N/A"} (${m.report_count} reports, ${formatINR(m.allocated_amount)} allocated)`,
    );
  }
  lines.push("");
  lines.push("## Priority recommendations");
  if (recs.length === 0) lines.push("- None for this selection.");
  recs.forEach((r, i) => {
    lines.push(`### ${i + 1}. ${r.title} (${r.ward_name})`);
    lines.push(r.rationale);
    lines.push(`- Suggested move: ${r.suggested_reallocation}`);
    lines.push(`- Beneficiaries: ${r.beneficiaries}`);
    lines.push(`- Scores: demand ${r.demand_score}, budget share ${r.budget_share_pct}%, alignment ${r.alignment_score ?? "N/A"}, priority ${r.priority_score}`);
    lines.push(`- Why: ${r.reason}`);
    lines.push(`- Source: ${r.data_source}. ${r.completeness_note}`);
    lines.push("");
  });
  lines.push("## Method note");
  lines.push("Demand, alignment, priority and impact scores are deterministic TypeScript (see README scoring formulas). AI structures reports and drafts explanations; it never sets funding math.");
  return lines.join("\n");
}

function pct(share: number | null): string {
  return share === null ? "N/A" : `${Math.round(share * 100)}%`;
}
