import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeCitizenReport } from "@/lib/gemini";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { recalculateMetricsPure } from "@/lib/metrics";
import { MAX_REPORT_CHARS } from "@/lib/constants";
import { makeTrackingId } from "@/lib/utils";

const Body = z.object({
  text: z.string().min(10).max(MAX_REPORT_CHARS),
  wardId: z.string().min(1),
  language: z.string().default("en"),
  manualCategory: z.string().optional(),
  anonymous: z.boolean().default(true),
});

/**
 * POST /api/analyze-report
 * Classify a citizen report (Gemini, with deterministic fallback),
 * persist it, and refresh the ward's metrics. Never throws AI errors
 * to the client — the fallback path keeps the demo alive.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid report payload." }, { status: 400 });
  }

  const analysis = await analyzeCitizenReport(body.text, {
    manualCategory: body.manualCategory,
    languageHint: body.language,
  });
  const trackingId = makeTrackingId(body.text);

  // Persist when Supabase is live; otherwise return a demo-mode receipt.
  if (isSupabaseConfiguredServer) {
    try {
      const sb = await createServiceClient();
      if (!sb) throw new Error("no-service-client");
      const { data: inserted, error } = await sb
        .from("citizen_reports")
        .insert({
          ward_id: body.wardId,
          tracking_id: trackingId,
          original_text: body.text,
          translated_text: analysis.translatedText,
          language: body.language,
          category: analysis.category,
          sub_category: analysis.subCategory,
          ai_summary: analysis.summary,
          urgency_score: analysis.urgencyScore,
          department: analysis.department,
          is_anonymous: body.anonymous,
          is_actionable: analysis.isActionable,
          ai_confidence: analysis.confidence,
          ai_failed: analysis.aiFailed,
          status: analysis.isActionable ? "new" : "flagged",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Fire-and-forget metric refresh for the ward (best effort).
      refreshWardMetrics(sb, body.wardId).catch(() => {});

      return NextResponse.json({
        ok: true,
        trackingId,
        reportId: (inserted as { id: string }).id,
        analysis: {
          translatedText: analysis.translatedText,
          category: analysis.category,
          subCategory: analysis.subCategory,
          summary: analysis.summary,
          urgency: analysis.urgency,
          urgencyScore: analysis.urgencyScore,
          department: analysis.department,
          confidence: analysis.confidence,
          aiFailed: analysis.aiFailed,
        },
      });
    } catch {
      // Storage failed but classification succeeded — still return the analysis
      // so the citizen sees confirmation; the report copy is recoverable client-side.
      return NextResponse.json({
        ok: true,
        trackingId,
        demoMode: true,
        storageWarning: true,
        analysis: {
          translatedText: analysis.translatedText,
          category: analysis.category,
          subCategory: analysis.subCategory,
          summary: analysis.summary,
          urgency: analysis.urgency,
          urgencyScore: analysis.urgencyScore,
          department: analysis.department,
          confidence: analysis.confidence,
          aiFailed: analysis.aiFailed,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    trackingId,
    demoMode: true,
    analysis: {
      translatedText: analysis.translatedText,
      category: analysis.category,
      subCategory: analysis.subCategory,
      summary: analysis.summary,
      urgency: analysis.urgency,
      urgencyScore: analysis.urgencyScore,
      department: analysis.department,
      confidence: analysis.confidence,
      aiFailed: analysis.aiFailed,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshWardMetrics(sb: any, wardId: string) {
  const [{ data: reports }, { data: budgets }] = await Promise.all([
    sb.from("citizen_reports").select("ward_id, category, urgency_score, created_at, status, original_text, translated_text").eq("ward_id", wardId),
    sb.from("budget_allocations").select("ward_id, category, allocated_amount, spent_amount").eq("ward_id", wardId),
  ]);
  const metrics = recalculateMetricsPure(reports ?? [], budgets ?? [], "2025-26");
  for (const m of metrics) {
    await sb.from("ward_category_metrics").upsert(
      { ...m, calculated_at: new Date().toISOString() },
      { onConflict: "ward_id,category,period" },
    );
  }
}
