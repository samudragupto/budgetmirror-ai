export interface BudgetAllocation {
  id: string;
  ward_id: string | null;
  budget_upload_id: string | null;
  financial_year: string;
  category: string;
  sub_category: string | null;
  allocated_amount: number;
  spent_amount: number;
  funding_source: string | null;
  created_at: string;
}

export interface BudgetUpload {
  id: string;
  file_name: string;
  file_url: string | null;
  source_type: "csv" | "pdf";
  financial_year: string;
  extraction_status: "pending" | "review" | "approved" | "rejected" | "failed";
  row_count: number | null;
  created_at: string;
}
