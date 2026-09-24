/**
 * Central enums / constants for BudgetMirror AI.
 * Categories, departments, statuses and UI metadata live here so the
 * AI prompts, validators, scoring engine and UI can never drift apart.
 */

export const CATEGORIES = [
  "Water Supply",
  "Sanitation & Drainage",
  "Roads & Mobility",
  "Education",
  "Healthcare",
  "Electricity",
  "Waste Management",
  "Digital Infrastructure",
  "Agriculture & Irrigation",
  "Public Safety",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value);

/** Short labels used in charts where space is tight. */
export const CATEGORY_SHORT: Record<Category, string> = {
  "Water Supply": "Water",
  "Sanitation & Drainage": "Drainage",
  "Roads & Mobility": "Roads",
  Education: "Education",
  Healthcare: "Health",
  Electricity: "Power",
  "Waste Management": "Waste",
  "Digital Infrastructure": "Digital",
  "Agriculture & Irrigation": "Agri",
  "Public Safety": "Safety",
};

export const DEPARTMENTS: Record<Category, string> = {
  "Water Supply": "Water Supply Department",
  "Sanitation & Drainage": "Sanitation Department",
  "Roads & Mobility": "Public Works Department",
  Education: "Education Department",
  Healthcare: "Health Department",
  Electricity: "Electricity Board",
  "Waste Management": "Solid Waste Department",
  "Digital Infrastructure": "IT & Digital Services",
  "Agriculture & Irrigation": "Agriculture Department",
  "Public Safety": "Police & Civic Safety",
};

export const REPORT_STATUSES = [
  "new",
  "under_review",
  "acknowledged",
  "resolved",
  "flagged",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  new: "New",
  under_review: "Under review",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  flagged: "Flagged (spam/abuse)",
};

export const PROJECT_STATUSES = [
  "Planned",
  "Funded",
  "In Progress",
  "Delayed",
  "Completed",
  "Citizen Validation Pending",
  "Impact Verified",
  "Needs Review",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const FINANCIAL_YEARS = ["2024-25", "2025-26", "2026-27"] as const;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Alignment score bands → pill colours (see ScorePill). */
export const ALIGNMENT_BANDS = [
  { min: 80, label: "Aligned", tone: "green" },
  { min: 60, label: "Fair", tone: "amber" },
  { min: 40, label: "Strained", tone: "orange" },
  { min: 0, label: "Critical", tone: "coral" },
] as const;

export const MISMATCH_LABELS = {
  UNDERFUNDED: "Underfunded Critical Need",
  OVERSPENDING: "Potential Overspending / Review",
  ALIGNED: "Aligned Priority",
  MONITOR: "Monitor",
} as const;
export type MismatchLabel = (typeof MISMATCH_LABELS)[keyof typeof MISMATCH_LABELS];

export const MAX_REPORT_CHARS = 2000;
export const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

export const ADMIN_DISCLAIMER =
  "Decision-support only. Final funding decisions remain with authorized officials.";

export const CITIZEN_PRIVACY_NOTE =
  "Anonymous by default. We never ask for Aadhaar, phone numbers, or personal identity details.";
