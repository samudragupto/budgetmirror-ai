import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRecommendation, explainMismatch } from "@/lib/gemini";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { demoMetrics } from "@/lib/demo-data";
import { adminMutationError } from "@/lib/admin-auth";

const Body = z.object({
  wardId: z.string().min(1),
  category: z.string().min(1),
  mode: z.enum(["single", "brief"]).default("single"),
});

/**
 * POST /api/generate-recommendation
 * Deterministic scores choose WHAT; Gemini drafts the prose wrapper.
 * Falls back to template prose when AI is unavailable.
 */
export async function POST(req: Request) {
  const denied = await adminMutationError();
  if (denied) return denied;

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const metric = await loadMetric(body.wardId, body.category);
  if (!metric) {
    return NextResponse.json({ ok: false, error: "No metrics for that ward/category yet." }, { status: 404 });
  }

  const overfunded = await loadOverfunded(body.wardId, body.category);

  const [aiRec, aiExplain] = await Promise.all([
    generateRecommendation({
      wardName: metric.ward_name,
      category: metric.category,
      demandScore: metric.demand_score,
      budgetSharePct: metric.budget_share === null ? 0 : Math.round(metric.budget_share * 100),
      alignmentScore: metric.alignment_score,
      priorityScore: metric.priority_score ?? 0,
      overfundedCategory: overfunded?.category,
      overfundedSharePct: overfunded && overfunded.budget_share !== null ? Math.round(overfunded.budget_share * 100) : undefined,
    }),
    explainMismatch({
      wardName: metric.ward_name,
      category: metric.category,
      demandScore: metric.demand_score,
      demandSharePct: metric.demand_share === null ? 0 : Math.round(metric.demand_share * 100),
      budgetSharePct: metric.budget_share === null ? 0 : Math.round(metric.budget_share * 100),
      alignmentScore: metric.alignment_score,
      reportCount: metric.report_count,
    }),
  ]);

  const budgetPct = metric.budget_share === null ? 0 : Math.round(metric.budget_share * 100);
  const fallbackRationale =
    `${metric.category} in ${metric.ward_name} carries demand ${metric.demand_score}/100 across ${metric.report_count} reports ` +
    `against a ${budgetPct}% budget share (alignment ${metric.alignment_score ?? "N/A"}). ` +
    (aiExplain ?? "Closing this gap first gives the highest citizen relief per rupee.");

  if (body.mode === "brief") {
    const brief =
      aiRec?.rationale ??
      `Priority for ${metric.ward_name}: act on ${metric.category}. ${fallbackRationale} ` +
        `Suggested move: review lower-demand heads${overfunded ? ` such as ${overfunded.category}` : ""} and redirect toward ${metric.category.toLowerCase()} works. ` +
        `Scores: demand ${metric.demand_score}, budget ${budgetPct}%, alignment ${metric.alignment_score ?? "N/A"}, priority ${metric.priority_score ?? 0}.`;
    return NextResponse.json({ ok: true, brief, aiUsed: Boolean(aiRec) });
  }

  return NextResponse.json({
    ok: true,
    recommendation: {
      title: aiRec?.title ?? `Priority action: ${metric.category} in ${metric.ward_name}`,
      rationale: aiRec?.rationale ?? fallbackRationale,
      suggestedReallocation: aiRec?.suggestedReallocation ?? "See the deterministic recommendation card for the suggested move.",
      beneficiaries: aiRec?.beneficiaries ?? "Ward residents (field verification refines reach).",
    },
    scores: {
      demand: metric.demand_score,
      budgetSharePct: budgetPct,
      alignment: metric.alignment_score,
      priority: metric.priority_score,
    },
    aiUsed: Boolean(aiRec),
  });
}

async function loadMetric(wardId: string, category: string) {
  if (!isSupabaseConfiguredServer) {
    const m = demoMetrics.find((x) => x.ward_id === wardId && x.category === category);
    return m ? { ...m, ward_name: m.ward_name ?? wardId } : null;
  }
  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("x");
    const { data } = await sb
      .from("ward_category_metrics")
      .select("*, ward:wards(ward_name, ward_no)")
      .eq("ward_id", wardId)
      .eq("category", category)
      .eq("period", "2025-26")
      .single();
    if (!data) return null;
    const row = data as typeof data & { ward?: { ward_name: string; ward_no: number | null } | null };
    return {
      ...(row as unknown as Omit<typeof row, "ward">),
      ward_name: row.ward ? `${row.ward.ward_no ? `Ward ${row.ward.ward_no} · ` : ""}${row.ward.ward_name}` : wardId,
    } as {
      ward_name: string; category: string; demand_score: number;
      demand_share: number | null; budget_share: number | null;
      alignment_score: number | null; priority_score: number | null; report_count: number;
    };
  } catch {
    const m = demoMetrics.find((x) => x.ward_id === wardId && x.category === category);
    return m ? { ...m, ward_name: m.ward_name ?? wardId } : null;
  }
}

async function loadOverfunded(wardId: string, exclude: string) {
  if (!isSupabaseConfiguredServer) {
    return demoMetrics.find((x) => x.ward_id === wardId && x.category !== exclude && (x.budget_share ?? 0) >= 0.25 && x.demand_score < 40) ?? null;
  }
  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("x");
    const { data } = await sb
      .from("ward_category_metrics")
      .select("category, budget_share, demand_score")
      .eq("ward_id", wardId)
      .eq("period", "2025-26")
      .neq("category", exclude)
      .order("budget_share", { ascending: false })
      .limit(1)
      .single();
    return (data as { category: string; budget_share: number | null; demand_score: number } | null) ?? null;
  } catch {
    return null;
  }
}
