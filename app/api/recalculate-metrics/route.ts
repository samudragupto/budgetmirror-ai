import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { recalculateMetricsPure } from "@/lib/metrics";
import { adminMutationError } from "@/lib/admin-auth";

const Body = z.object({
  wardId: z.string().optional(),
  period: z.string().default("2025-26"),
});

/** POST /api/recalculate-metrics — recompute ward_category_metrics deterministically. */
export async function POST(req: Request) {
  const denied = await adminMutationError();
  if (denied) return denied;

  let body: z.infer<typeof Body> = { period: "2025-26" };
  try {
    const json = await req.json().catch(() => ({}));
    body = Body.parse(json);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  if (!isSupabaseConfiguredServer) {
    return NextResponse.json({ ok: true, updated: 0, demoMode: true });
  }

  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("no-service-client");

    let reportQuery = sb.from("citizen_reports").select("ward_id, category, urgency_score, created_at, status, original_text, translated_text");
    let budgetQuery = sb.from("budget_allocations").select("ward_id, category, allocated_amount, spent_amount");
    if (body.wardId) {
      reportQuery = reportQuery.eq("ward_id", body.wardId);
      budgetQuery = budgetQuery.eq("ward_id", body.wardId);
    }
    const [{ data: reports }, { data: budgets }] = await Promise.all([reportQuery, budgetQuery]);
    const metrics = recalculateMetricsPure(reports ?? [], budgets ?? [], body.period);

    let updated = 0;
    for (const m of metrics) {
      const { error } = await sb.from("ward_category_metrics").upsert(
        { ...m, calculated_at: new Date().toISOString() },
        { onConflict: "ward_id,category,period" },
      );
      if (!error) updated++;
    }
    return NextResponse.json({ ok: true, updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Recalculation failed." }, { status: 500 });
  }
}
