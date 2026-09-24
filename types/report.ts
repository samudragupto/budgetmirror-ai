import type { Category, ReportStatus } from "@/lib/constants";

export interface Ward {
  id: string;
  ward_no: number | null;
  ward_name: string;
  district_name: string;
  state_name: string;
  country: string;
  lat: number | null;
  lng: number | null;
  population: number | null;
  vulnerability_score: number | null;
}

export interface CitizenReport {
  id: string;
  tracking_id: string | null;
  ward_id: string | null;
  ward?: Pick<Ward, "id" | "ward_name" | "ward_no"> | null;
  submitted_by: string | null;
  original_text: string;
  translated_text: string | null;
  language: string | null;
  category: string;
  sub_category: string | null;
  ai_summary: string | null;
  urgency_score: number | null;
  department: string | null;
  is_anonymous: boolean;
  is_actionable: boolean | null;
  ai_confidence: number | null;
  ai_failed: boolean;
  status: ReportStatus;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface ReportFilters {
  wardId?: string;
  category?: Category | "all";
  minUrgency?: number;
  status?: ReportStatus | "all";
  query?: string;
}
