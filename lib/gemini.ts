/**
 * Server-only Gemini integration.
 * AI structures and explains; scoring stays in lib/scoring.ts.
 *
 * Every function degrades gracefully: on missing keys, quota errors, or
 * malformed JSON the caller gets a deterministic fallback — the demo
 * never dies because the model is unavailable.
 */
import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CATEGORIES, DEPARTMENTS, type Category } from "./constants";

export interface AIReportAnalysis {
  originalLanguage: string;
  translatedText: string;
  category: Category;
  subCategory: string;
  summary: string;
  urgency: "low" | "medium" | "high" | "critical";
  urgencyScore: number;
  affectedGroups: string[];
  department: string;
  sentiment: string;
  isActionable: boolean;
  confidence: number; // 0-100, 0 when fallback
  aiFailed: boolean;
}

export interface AIBudgetRow {
  wardName: string;
  financialYear: string;
  category: string;
  subCategory: string;
  allocatedAmount: number;
  spentAmount: number;
  projectName: string;
  projectStatus: string;
}

export interface AIRecommendation {
  title: string;
  rationale: string;
  suggestedReallocation: string;
  beneficiaries: string;
}

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith("dummy")) return null;
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && !key.startsWith("dummy");
}

/** Strip markdown fences and extract the first JSON object/array. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.search(/[{[]/);
  if (start === -1) throw new Error("No JSON found in model response");
  return candidate.slice(start);
}

function safeParse<T>(raw: string): T {
  return JSON.parse(extractJson(raw)) as T;
}

const URGENCY_TO_SCORE: Record<string, number> = {
  low: 20,
  medium: 50,
  high: 80,
  critical: 95,
};

export function fallbackAnalysis(text: string, manualCategory?: string): AIReportAnalysis {
  const category: Category =
    manualCategory && (CATEGORIES as readonly string[]).includes(manualCategory)
      ? (manualCategory as Category)
      : "Water Supply";
  return {
    originalLanguage: "unknown",
    translatedText: text,
    category,
    subCategory: "General",
    summary: text.length > 160 ? text.slice(0, 157) + "…" : text,
    urgency: "medium",
    urgencyScore: 50,
    affectedGroups: [],
    department: DEPARTMENTS[category],
    sentiment: "neutral",
    isActionable: true,
    confidence: 0,
    aiFailed: true,
  };
}

const CATEGORY_LIST = CATEGORIES.join(" | ");

export async function analyzeCitizenReport(
  text: string,
  opts?: { manualCategory?: string; languageHint?: string },
): Promise<AIReportAnalysis> {
  const ai = getClient();
  if (!ai) return fallbackAnalysis(text, opts?.manualCategory);

  const prompt = `You are a civic grievance classifier for Indian municipal governance.
Classify the citizen report below into EXACTLY one of these categories:
${CATEGORY_LIST}

Rules:
- Translate non-English text to English in "translated_text" (keep original meaning, no PII invention).
- "is_actionable" is false ONLY for spam, abuse, jokes, or non-infrastructure topics.
- urgency_score 0-100: no water/power/roads for days, school/hospital affected, safety risk → 75-100.
- affected_groups: e.g. ["school children","elderly","patients","farmers"] or [].
- department: the municipal department that owns this category.
- confidence 0-100 in your classification.
- Respond with JSON ONLY, no markdown, no commentary.

Schema:
{"original_language":"..","translated_text":"..","category":"..","sub_category":"..","summary":".. (<=140 chars)","urgency":"low|medium|high|critical","urgency_score":0,"affected_groups":[],"department":"..","sentiment":"..","is_actionable":true,"confidence":0}

Report (language hint: ${opts?.languageHint ?? "auto"}):
"""${text.slice(0, 2000)}"""`;

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    });
    const result = await model.generateContent(prompt);
    const parsed = safeParse<Record<string, unknown>>(result.response.text());

    const rawCategory = String(parsed.category ?? "");
    const category: Category = (CATEGORIES as readonly string[]).includes(rawCategory)
      ? (rawCategory as Category)
      : "Water Supply";
    const urgencyRaw = String(parsed.urgency ?? "medium").toLowerCase();
    const urgency = (
      ["low", "medium", "high", "critical"].includes(urgencyRaw) ? urgencyRaw : "medium"
    ) as AIReportAnalysis["urgency"];

    return {
      originalLanguage: String(parsed.original_language ?? opts?.languageHint ?? "unknown"),
      translatedText: String(parsed.translated_text ?? text),
      category,
      subCategory: String(parsed.sub_category ?? "General"),
      summary: String(parsed.summary ?? text.slice(0, 140)),
      urgency,
      urgencyScore:
        typeof parsed.urgency_score === "number"
          ? Math.min(100, Math.max(0, Math.round(parsed.urgency_score)))
          : (URGENCY_TO_SCORE[urgency] ?? 50),
      affectedGroups: Array.isArray(parsed.affected_groups)
        ? parsed.affected_groups.map(String)
        : [],
      department: String(parsed.department ?? DEPARTMENTS[category]),
      sentiment: String(parsed.sentiment ?? "neutral"),
      isActionable: parsed.is_actionable !== false,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(100, Math.max(0, Math.round(parsed.confidence)))
          : 70,
      aiFailed: false,
    };
  } catch {
    return fallbackAnalysis(text, opts?.manualCategory);
  }
}

export async function extractBudgetFromText(
  text: string,
  financialYear: string,
): Promise<{ rows: AIBudgetRow[]; failed: boolean }> {
  const ai = getClient();
  if (!ai) return { rows: [], failed: true };
  const prompt = `Extract municipal budget allocation rows from the document text below.
Categories must be one of: ${CATEGORY_LIST}
Amounts are in INR (numbers only, no commas/symbols). If spent is unknown use 0.
Respond with JSON ONLY: {"rows":[{"ward_name":"","financial_year":"${financialYear}","category":"","sub_category":"","allocated_amount":0,"spent_amount":0,"project_name":"","project_status":"Planned"}]}

Document text:
"""${text.slice(0, 12000)}"""`;
  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    });
    const result = await model.generateContent(prompt);
    const parsed = safeParse<{ rows: AIBudgetRow[] }>(result.response.text());
    return { rows: Array.isArray(parsed.rows) ? parsed.rows : [], failed: false };
  } catch {
    return { rows: [], failed: true };
  }
}

export async function explainMismatch(input: {
  wardName: string;
  category: string;
  demandScore: number;
  demandSharePct: number;
  budgetSharePct: number;
  alignmentScore: number | null;
  reportCount: number;
}): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;
  const prompt = `In 2-3 plain sentences for a non-technical citizen, explain this municipal budget mismatch. No jargon, no markdown.
Ward: ${input.wardName}; Category: ${input.category}; Citizen demand score ${input.demandScore}/100 from ${input.reportCount} reports (${input.demandSharePct}% of ward demand); Budget share ${input.budgetSharePct}%; Alignment ${input.alignmentScore ?? "N/A"}/100.`;
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch {
    return null;
  }
}

export async function generateRecommendation(input: {
  wardName: string;
  category: string;
  demandScore: number;
  budgetSharePct: number;
  alignmentScore: number | null;
  priorityScore: number;
  overfundedCategory?: string;
  overfundedSharePct?: number;
}): Promise<AIRecommendation | null> {
  const ai = getClient();
  if (!ai) return null;
  const prompt = `You advise a municipal budget committee. Draft ONE priority action as JSON ONLY (no markdown):
{"title":"","rationale":"2 sentences max","suggested_reallocation":"","beneficiaries":""}
Context: ${input.wardName} needs ${input.category} (demand ${input.demandScore}/100, budget share ${input.budgetSharePct}%, alignment ${input.alignmentScore ?? "N/A"}, priority ${input.priorityScore}/100).${
    input.overfundedCategory
      ? ` Possible source: ${input.overfundedCategory} at ${input.overfundedSharePct}% of ward budget.`
      : ""
  } Keep it practical and specific to Indian municipal works.`;
  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    });
    const result = await model.generateContent(prompt);
    const parsed = safeParse<AIRecommendation>(result.response.text());
    if (!parsed.title) return null;
    return parsed;
  } catch {
    return null;
  }
}
