import type { MismatchLabel } from "@/lib/constants";

export interface WardCategoryMetric {
  id: string;
  ward_id: string;
  ward_name?: string;
  category: string;
  period: string;
  demand_score: number;
  demand_share: number | null;
  budget_share: number | null;
  alignment_score: number | null;
  mismatch_score: number | null;
  mismatch_label?: MismatchLabel;
  priority_score: number | null;
  report_count: number;
  allocated_amount: number;
  spent_amount: number;
  calculated_at: string;
}

export interface Recommendation {
  id: string;
  ward_id: string;
  ward_name: string;
  category: string;
  title: string;
  rationale: string;
  suggested_reallocation: string;
  beneficiaries: string;
  demand_score: number;
  budget_share_pct: number;
  alignment_score: number | null;
  priority_score: number;
  reason: string;
  data_source: string;
  completeness_note: string;
  ai_explanation: string | null;
}
