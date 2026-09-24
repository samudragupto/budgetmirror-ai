import type { ProjectStatus } from "@/lib/constants";

export interface Project {
  id: string;
  ward_id: string | null;
  budget_allocation_id: string | null;
  project_name: string;
  category: string;
  description: string | null;
  estimated_cost: number | null;
  spent_amount: number | null;
  status: ProjectStatus;
  planned_start: string | null;
  planned_end: string | null;
  actual_completion: string | null;
  created_at: string;
}

export interface ProjectValidation {
  id: string;
  project_id: string;
  user_id: string | null;
  rating: number; // 1-5
  issue_resolved: "yes" | "partial" | "no";
  feedback: string | null;
  created_at: string;
}

export interface ProjectWithStats extends Project {
  ward_name?: string | null;
  validation_count: number;
  avg_rating: number | null;
  resolved_yes: number;
  resolved_partial: number;
  resolved_no: number;
  impact_score: number | null;
}
