/**
 * Sampurna District — offline demo dataset.
 *
 * Used whenever Supabase is not configured (cold load, CI, no-network
 * demos) AND mirrored 1:1 by supabase/seed.sql so the story is identical
 * in both modes. The central story is Ward 5 (Ujjwal Nagar):
 * water demand 93 vs 11% budget share → alignment 31.
 */
import type { Ward, CitizenReport } from "@/types/report";
import type { BudgetAllocation } from "@/types/budget";
import type { Project, ProjectValidation } from "@/types/project";
import type { WardCategoryMetric, Recommendation } from "@/types/metrics";

export const DEMO_PERIOD = "2025-26";

export const demoWards: Ward[] = [
  { id: "ward-1", ward_no: 1, ward_name: "Adarsh Nagar", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.545, lng: 73.841, population: 12500, vulnerability_score: 42 },
  { id: "ward-2", ward_no: 2, ward_name: "Shantinagar", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.531, lng: 73.869, population: 9800, vulnerability_score: 35 },
  { id: "ward-3", ward_no: 3, ward_name: "Nadi Kinara", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.512, lng: 73.852, population: 15200, vulnerability_score: 61 },
  { id: "ward-4", ward_no: 4, ward_name: "Gadhi Mohalla", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.528, lng: 73.83, population: 7400, vulnerability_score: 55 },
  { id: "ward-5", ward_no: 5, ward_name: "Ujjwal Nagar", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.519, lng: 73.845, population: 18400, vulnerability_score: 78 },
  { id: "ward-6", ward_no: 6, ward_name: "Harit Vihar", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.538, lng: 73.857, population: 11200, vulnerability_score: 28 },
  { id: "ward-7", ward_no: 7, ward_name: "Market Road", district_name: "Sampurna", state_name: "Maharashtra", country: "India", lat: 18.524, lng: 73.878, population: 9600, vulnerability_score: 33 },
];

export function wardLabel(w: Pick<Ward, "ward_no" | "ward_name">): string {
  return w.ward_no ? `Ward ${w.ward_no} · ${w.ward_name}` : w.ward_name;
}

/* ---------------- Citizen reports (representative sample) ---------------- */

interface DemoReportSeed {
  ward: string;
  text: string;
  translated: string | null;
  lang: string;
  category: string;
  sub: string;
  summary: string;
  urgency: number;
  dept: string;
  groups?: boolean;
  daysAgo: number;
  status?: CitizenReport["status"];
}

const seeds: DemoReportSeed[] = [
  { ward: "ward-5", text: "There has been no water supply in Ward 5 for three days. The school is also affected.", translated: null, lang: "en", category: "Water Supply", sub: "Piped water outage", summary: "Piped water outage for 3 days in Ujjwal Nagar; local school affected.", urgency: 92, dept: "Water Supply Department", groups: true, daysAgo: 1 },
  { ward: "ward-5", text: "वार्ड 5 में तीन दिन से पानी नहीं आ रहा है। स्कूल के बच्चे परेशान हैं।", translated: "No water in Ward 5 for three days. School children are suffering.", lang: "hi", category: "Water Supply", sub: "Piped water outage", summary: "Hindi report: 3-day water outage; school children suffering.", urgency: 90, dept: "Water Supply Department", groups: true, daysAgo: 1 },
  { ward: "ward-5", text: "Handpump near the anganwadi has been dry for a week, women walk 2 km for water.", translated: null, lang: "en", category: "Water Supply", sub: "Handpump failure", summary: "Anganwadi handpump dry for a week; long water-fetching walks.", urgency: 85, dept: "Water Supply Department", groups: true, daysAgo: 3 },
  { ward: "ward-5", text: "Tanker comes only twice a week and fights break out in the queue.", translated: null, lang: "en", category: "Water Supply", sub: "Tanker shortfall", summary: "Water tanker frequency too low; queue conflicts reported.", urgency: 78, dept: "Water Supply Department", daysAgo: 4 },
  { ward: "ward-5", text: "पाइपलाइन फूटी हुई है, गली में पानी बह रहा है पर घरों में नल सूखे हैं।", translated: "Pipeline is burst; water floods the lane but household taps are dry.", lang: "hi", category: "Water Supply", sub: "Pipeline leakage", summary: "Burst pipeline wastes water while taps run dry.", urgency: 88, dept: "Water Supply Department", daysAgo: 2 },
  { ward: "ward-5", text: "New decorative lights installed on every pole but our taps are dry. Priorities?", translated: null, lang: "en", category: "Electricity", sub: "Decorative lighting", summary: "Citizen questions decorative lighting spend amid water crisis.", urgency: 45, dept: "Electricity Board", daysAgo: 5 },
  { ward: "ward-3", text: "Drainage nullah overflows every monsoon, dirty water enters homes near the bridge.", translated: null, lang: "en", category: "Sanitation & Drainage", sub: "Nullah overflow", summary: "Monsoon nullah overflow floods homes near Nadi Kinara bridge.", urgency: 82, dept: "Sanitation Department", groups: true, daysAgo: 6 },
  { ward: "ward-3", text: "Drain desilting work started in June and stopped halfway. Stagnant water breeds mosquitoes.", translated: null, lang: "en", category: "Sanitation & Drainage", sub: "Desilting delay", summary: "Half-finished desilting leaves stagnant water, mosquito risk.", urgency: 76, dept: "Sanitation Department", daysAgo: 9 },
  { ward: "ward-1", text: "Main road full of potholes, two accidents this month near the bus stop.", translated: null, lang: "en", category: "Roads & Mobility", sub: "Potholes", summary: "Pothole-ridden main road; two accidents near bus stop.", urgency: 81, dept: "Public Works Department", daysAgo: 2 },
  { ward: "ward-1", text: "Road repair completed last month is already crumbling. Please check quality.", translated: null, lang: "en", category: "Roads & Mobility", sub: "Repair quality", summary: "Fresh road repair crumbling within a month; quality questioned.", urgency: 62, dept: "Public Works Department", daysAgo: 7 },
  { ward: "ward-4", text: "Girls' toilet in the zilla parishad school has no door and no water.", translated: null, lang: "en", category: "Education", sub: "School toilets", summary: "ZP school girls' toilet lacks door and water.", urgency: 84, dept: "Education Department", groups: true, daysAgo: 3 },
  { ward: "ward-6", text: "Garbage pickup skipped twice this month, bins overflow near the park.", translated: null, lang: "en", category: "Waste Management", sub: "Collection gap", summary: "Missed garbage pickups; park bins overflowing.", urgency: 55, dept: "Solid Waste Department", daysAgo: 4 },
  { ward: "ward-2", text: "Streetlights on Station Road don't work, feels unsafe after dark.", translated: null, lang: "en", category: "Public Safety", sub: "Streetlight outage", summary: "Station Road streetlights out; safety concern after dark.", urgency: 68, dept: "Police & Civic Safety", groups: true, daysAgo: 5 },
  { ward: "ward-7", text: "PHC has no doctor on most days, we travel 12 km for basic treatment.", translated: null, lang: "en", category: "Healthcare", sub: "PHC staffing", summary: "PHC mostly without doctor; 12 km travel for basic care.", urgency: 79, dept: "Health Department", groups: true, daysAgo: 8 },
];

export const demoReports: CitizenReport[] = seeds.map((s, i) => {
  const d = new Date();
  d.setDate(d.getDate() - s.daysAgo);
  return {
    id: `rep-${String(i + 1).padStart(3, "0")}`,
    tracking_id: `BM-2026-${["7F3K9Q", "2D8M4P", "9Q1Z7X", "4T6B2N", "8H5J3K", "1A2B3C"][i % 6]}`,
    ward_id: s.ward,
    ward: (() => {
      const w = demoWards.find((x) => x.id === s.ward);
      return w ? { id: w.id, ward_name: w.ward_name, ward_no: w.ward_no } : null;
    })(),
    submitted_by: null,
    original_text: s.text,
    translated_text: s.translated,
    language: s.lang,
    category: s.category,
    sub_category: s.sub,
    ai_summary: s.summary,
    urgency_score: s.urgency,
    department: s.dept,
    is_anonymous: true,
    is_actionable: true,
    ai_confidence: 82 + ((i * 7) % 14),
    ai_failed: false,
    status: s.status ?? (i % 5 === 0 ? "acknowledged" : "new"),
    lat: null,
    lng: null,
    created_at: d.toISOString(),
  };
});

/* ---------------- Budgets ---------------- */

export const demoBudgets: BudgetAllocation[] = [
  // Ward 5 — the mismatch story. Total ≈ ₹75.0L.
  { id: "b-w5-water", ward_id: "ward-5", budget_upload_id: null, financial_year: "2025-26", category: "Water Supply", sub_category: "Pipeline maintenance", allocated_amount: 825000, spent_amount: 210000, funding_source: "Municipal fund", created_at: "2025-06-01T00:00:00Z" },
  { id: "b-w5-light", ward_id: "ward-5", budget_upload_id: null, financial_year: "2025-26", category: "Electricity", sub_category: "Decorative / festival lighting", allocated_amount: 4050000, spent_amount: 3820000, funding_source: "Municipal fund", created_at: "2025-06-01T00:00:00Z" },
  { id: "b-w5-road", ward_id: "ward-5", budget_upload_id: null, financial_year: "2025-26", category: "Roads & Mobility", sub_category: "Lane resurfacing", allocated_amount: 1200000, spent_amount: 640000, funding_source: "State grant", created_at: "2025-06-01T00:00:00Z" },
  { id: "b-w5-waste", ward_id: "ward-5", budget_upload_id: null, financial_year: "2025-26", category: "Waste Management", sub_category: "Collection contract", allocated_amount: 900000, spent_amount: 500000, funding_source: "Municipal fund", created_at: "2025-06-01T00:00:00Z" },
  { id: "b-w5-health", ward_id: "ward-5", budget_upload_id: null, financial_year: "2025-26", category: "Healthcare", sub_category: "Sub-centre upkeep", allocated_amount: 525000, spent_amount: 180000, funding_source: "NHM", created_at: "2025-06-01T00:00:00Z" },
  // Ward 1 — roads aligned (high demand + high funding).
  { id: "b-w1-road", ward_id: "ward-1", budget_upload_id: null, financial_year: "2025-26", category: "Roads & Mobility", sub_category: "Arterial repair", allocated_amount: 3200000, spent_amount: 2100000, funding_source: "State grant", created_at: "2025-06-01T00:00:00Z" },
  { id: "b-w1-water", ward_id: "ward-1", budget_upload_id: null, financial_year: "2025-26", category: "Water Supply", sub_category: "Tank chlorination", allocated_amount: 600000, spent_amount: 420000, funding_source: "Municipal fund", created_at: "2025-06-01T00:00:00Z" },
  // Ward 3 — drainage delayed project.
  { id: "b-w3-drain", ward_id: "ward-3", budget_upload_id: null, financial_year: "2025-26", category: "Sanitation & Drainage", sub_category: "Nullah desilting", allocated_amount: 1800000, spent_amount: 450000, funding_source: "State grant", created_at: "2025-06-01T00:00:00Z" },
  // Ward 4 — education toilets: demand, no project yet.
  { id: "b-w4-edu", ward_id: "ward-4", budget_upload_id: null, financial_year: "2025-26", category: "Education", sub_category: "School maintenance", allocated_amount: 250000, spent_amount: 40000, funding_source: "Samagra Shiksha", created_at: "2025-06-01T00:00:00Z" },
  // Ward 6 — waste moderate.
  { id: "b-w6-waste", ward_id: "ward-6", budget_upload_id: null, financial_year: "2025-26", category: "Waste Management", sub_category: "Collection contract", allocated_amount: 700000, spent_amount: 380000, funding_source: "Municipal fund", created_at: "2025-06-01T00:00:00Z" },
];

/* ---------------- Projects ---------------- */

export const demoProjects: Project[] = [
  { id: "prj-drain-3", ward_id: "ward-3", budget_allocation_id: "b-w3-drain", project_name: "Nadi Kinara nullah desilting (Phase 2)", category: "Sanitation & Drainage", description: "Desilt 2.4 km of the monsoon nullah and rebuild two culverts near the bridge.", estimated_cost: 1800000, spent_amount: 450000, status: "Delayed", planned_start: "2025-06-15", planned_end: "2025-09-30", actual_completion: null, created_at: "2025-06-10T00:00:00Z" },
  { id: "prj-road-1", ward_id: "ward-1", budget_allocation_id: "b-w1-road", project_name: "Adarsh Nagar arterial resurfacing", category: "Roads & Mobility", description: "Resurface 3.1 km arterial road including bus-stop bay and drainage crossfalls.", estimated_cost: 3200000, spent_amount: 2100000, status: "In Progress", planned_start: "2025-07-01", planned_end: "2025-12-15", actual_completion: null, created_at: "2025-06-20T00:00:00Z" },
  { id: "prj-light-5", ward_id: "ward-5", budget_allocation_id: "b-w5-light", project_name: "Ujjwal Nagar decorative lighting", category: "Electricity", description: "Ornamental LED poles across main lanes and the community hall frontage.", estimated_cost: 4050000, spent_amount: 3820000, status: "Completed", planned_start: "2025-04-01", planned_end: "2025-08-31", actual_completion: "2025-08-28", created_at: "2025-03-20T00:00:00Z" },
  { id: "prj-water-5", ward_id: "ward-5", budget_allocation_id: "b-w5-water", project_name: "Ujjwal Nagar pipeline rehabilitation (proposed)", category: "Water Supply", description: "Replace 1.8 km of leaking distribution pipeline and repair 6 standposts. Proposed — awaiting funding decision.", estimated_cost: 1200000, spent_amount: 0, status: "Planned", planned_start: null, planned_end: null, actual_completion: null, created_at: "2025-09-01T00:00:00Z" },
  { id: "prj-waste-6", ward_id: "ward-6", budget_allocation_id: "b-w6-waste", project_name: "Harit Vihar segregated collection pilot", category: "Waste Management", description: "Door-to-door segregated pickup with two compactors; citizen rating pilot.", estimated_cost: 700000, spent_amount: 380000, status: "Citizen Validation Pending", planned_start: "2025-05-01", planned_end: "2025-09-15", actual_completion: "2025-09-12", created_at: "2025-04-25T00:00:00Z" },
];

export const demoValidations: ProjectValidation[] = [
  { id: "val-1", project_id: "prj-waste-6", user_id: null, rating: 4, issue_resolved: "yes", feedback: "Pickup is regular now on our lane.", created_at: "2025-09-16T00:00:00Z" },
  { id: "val-2", project_id: "prj-waste-6", user_id: null, rating: 5, issue_resolved: "yes", feedback: "Bins near the park are cleared daily.", created_at: "2025-09-17T00:00:00Z" },
  { id: "val-3", project_id: "prj-waste-6", user_id: null, rating: 3, issue_resolved: "partial", feedback: "Better, but Sunday pickup still missed.", created_at: "2025-09-18T00:00:00Z" },
  { id: "val-4", project_id: "prj-light-5", user_id: null, rating: 2, issue_resolved: "no", feedback: "Pretty lights, but taps are dry. Wrong priority.", created_at: "2025-09-05T00:00:00Z" },
  { id: "val-5", project_id: "prj-light-5", user_id: null, rating: 3, issue_resolved: "partial", feedback: "Lane looks nice at night.", created_at: "2025-09-06T00:00:00Z" },
  { id: "val-6", project_id: "prj-drain-3", user_id: null, rating: 1, issue_resolved: "no", feedback: "Work stopped halfway, water still stagnates.", created_at: "2025-09-10T00:00:00Z" },
];

/* ---------------- Metrics (precomputed headline rows) ---------------- */

function metric(
  wardId: string,
  category: string,
  demand: number,
  dShare: number | null,
  bShare: number | null,
  align: number | null,
  priority: number,
  reports: number,
  allocated: number,
  spent: number,
): WardCategoryMetric {
  const w = demoWards.find((x) => x.id === wardId);
  return {
    id: `m-${wardId}-${category.replace(/[^a-z]+/gi, "-").toLowerCase()}`,
    ward_id: wardId,
    ward_name: w ? `${w.ward_no ? `Ward ${w.ward_no} · ` : ""}${w.ward_name}` : wardId,
    category,
    period: DEMO_PERIOD,
    demand_score: demand,
    demand_share: dShare,
    budget_share: bShare,
    alignment_score: align,
    mismatch_score: dShare !== null && bShare !== null ? Math.round(Math.abs(dShare - bShare) * 100) : null,
    priority_score: priority,
    report_count: reports,
    allocated_amount: allocated,
    spent_amount: spent,
    calculated_at: new Date().toISOString(),
  };
}

export const demoMetrics: WardCategoryMetric[] = [
  // Ward 5 — demand 93 vs budget 11% → alignment 31. THE story.
  metric("ward-5", "Water Supply", 93, 0.8, 0.11, 31, 86, 147, 825000, 210000),
  metric("ward-5", "Electricity", 8, 0.03, 0.54, 49, 22, 6, 4050000, 3820000),
  metric("ward-5", "Roads & Mobility", 41, 0.09, 0.16, 93, 38, 18, 1200000, 640000),
  metric("ward-5", "Waste Management", 35, 0.06, 0.12, 94, 30, 11, 900000, 500000),
  metric("ward-5", "Healthcare", 22, 0.02, 0.07, 95, 18, 4, 525000, 180000),
  // Ward 1 — roads aligned.
  metric("ward-1", "Roads & Mobility", 78, 0.62, 0.55, 93, 64, 52, 3200000, 2100000),
  metric("ward-1", "Water Supply", 34, 0.21, 0.18, 97, 28, 14, 600000, 420000),
  // Ward 3 — drainage delayed.
  metric("ward-3", "Sanitation & Drainage", 81, 0.71, 0.44, 73, 72, 44, 1800000, 450000),
  // Ward 4 — education toilets, no project.
  metric("ward-4", "Education", 76, 0.66, 0.09, 43, 74, 29, 250000, 40000),
  // Ward 6 — waste moderate.
  metric("ward-6", "Waste Management", 48, 0.42, 0.38, 96, 40, 21, 700000, 380000),
  // Ward 2 — safety lighting.
  metric("ward-2", "Public Safety", 58, 0.5, 0.2, 70, 55, 19, 410000, 120000),
  // Ward 7 — PHC staffing.
  metric("ward-7", "Healthcare", 69, 0.58, 0.24, 66, 61, 25, 640000, 190000),
];

/* ---------------- Recommendations ---------------- */

export const demoRecommendations: Recommendation[] = [
  {
    id: "rec-w5-water",
    ward_id: "ward-5",
    ward_name: "Ward 5 · Ujjwal Nagar",
    category: "Water Supply",
    title: "Rehabilitate Ujjwal Nagar's leaking distribution pipeline",
    rationale:
      "Water dominates Ward 5's citizen demand (score 93, 147 reports) yet receives only 11% of the ward budget. Burst pipes waste supply while taps run dry and two schools report disruptions.",
    suggested_reallocation:
      "Review ~₹12,00,000 from the decorative lighting allocation (54% of ward budget, low citizen demand) toward 1.8 km pipeline replacement and 6 standpost repairs.",
    beneficiaries: "~8,400 residents + 2 schools + 1 anganwadi",
    demand_score: 93,
    budget_share_pct: 11,
    alignment_score: 31,
    priority_score: 86,
    reason: "Priority 86 = 0.35×93 demand + 0.25×69 funding gap + severity/vulnerability/delay/validation terms.",
    data_source: "147 citizen reports · 2025-26 budget allocations · project ledger",
    completeness_note: "High confidence: report volume + budget breakup + project status all available.",
    ai_explanation: null,
  },
  {
    id: "rec-w4-edu",
    ward_id: "ward-4",
    ward_name: "Ward 4 · Gadhi Mohalla",
    category: "Education",
    title: "Repair ZP school girls' toilets (door + water connection)",
    rationale:
      "A high-urgency school-toilet gap (demand 76) has no linked project and only 9% budget share. Small, fast, high-dignity fix affecting girl students daily.",
    suggested_reallocation:
      "Fund from the ward maintenance head (~₹1,80,000): doors, plumbing reconnection, and a 6-month cleaning roster.",
    beneficiaries: "~320 girl students + school staff",
    demand_score: 76,
    budget_share_pct: 9,
    alignment_score: 43,
    priority_score: 74,
    reason: "Priority 74 = demand-led score with high severity (school children) and zero project coverage.",
    data_source: "29 citizen reports · 2025-26 budget allocations",
    completeness_note: "Medium confidence: no linked project record; site verification recommended.",
    ai_explanation: null,
  },
  {
    id: "rec-w3-drain",
    ward_id: "ward-3",
    ward_name: "Ward 3 · Nadi Kinara",
    category: "Sanitation & Drainage",
    title: "Restart the stalled nullah desilting before monsoon peak",
    rationale:
      "Desilting is funded (44% share) but stalled halfway — a delivery failure, not a funding gap. Stagnant water is already drawing mosquito complaints.",
    suggested_reallocation:
      "No new funds needed: enforce milestone-linked release of the remaining ~₹13,50,000 and publish a restart date.",
    beneficiaries: "~5,100 households near the nullah",
    demand_score: 81,
    budget_share_pct: 44,
    alignment_score: 73,
    priority_score: 72,
    reason: "Priority 72 = high demand + maximum delay term; funding gap term near zero.",
    data_source: "44 citizen reports · project status: Delayed · spend trail",
    completeness_note: "High confidence: contractor ledger + citizen validations agree work stalled.",
    ai_explanation: null,
  },
];

export const demoSummary = {
  totalReports: 147 + 52 + 44 + 29 + 21 + 19 + 25 + 18 + 14 + 11 + 6 + 4,
  wardsCovered: 7,
  criticalMismatches: 2,
  validations: demoValidations.length,
};
