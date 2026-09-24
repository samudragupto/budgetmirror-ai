import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBudgetCsv, matchWard } from "@/lib/csv-parser";
import { extractBudgetFromText } from "@/lib/gemini";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { recalculateMetricsPure } from "@/lib/metrics";

/**
 * POST /api/upload-budget — parse only (multipart file). Returns review rows.
 * PUT  /api/upload-budget — approve reviewed rows (JSON). Writes allocations,
 *   creates linked projects, recalculates metrics. Admin review is mandatory:
 *   POST never writes to the ledger.
 */

export async function POST(req: Request) {
  let file: File | null = null;
  let financialYear = "2025-26";
  try {
    const fd = await req.formData();
    file = fd.get("file") as File | null;
    financialYear = String(fd.get("financialYear") ?? "2025-26");
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form with a file." }, { status: 400 });
  }
  if (!file) return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });

  const wards = await listWards();
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

  if (!isPdf) {
    const text = await file.text();
    const { rows, errors } = parseBudgetCsv(text);
    return NextResponse.json({
      ok: true,
      rows: rows.map((r) => ({
        ward_name: r.ward_name,
        financial_year: r.financial_year,
        category: r.category,
        sub_category: r.sub_category,
        allocated_amount: r.allocated_amount,
        spent_amount: r.spent_amount,
        project_name: r.project_name,
        project_status: r.project_status,
        _line: r._line,
        _wardId: matchWard(r.ward_name, wards),
        _categoryValid: r._categoryValid,
      })),
      errors,
    });
  }

  // PDF path: extract text (naive) → Gemini structures rows → review grid.
  const buf = Buffer.from(await file.arrayBuffer());
  const text = buf.toString("utf-8").replace(/[^\x09\x0A\x0D\x20-\x7E\u0900-\u097F]/g, " ").slice(0, 12000);
  if (text.trim().length < 40) {
    return NextResponse.json({
      ok: false,
      error: "Could not read text from this PDF. Please upload a CSV or a text-based PDF.",
    }, { status: 422 });
  }
  const { rows, failed } = await extractBudgetFromText(text, financialYear);
  if (failed || rows.length === 0) {
    return NextResponse.json({ ok: true, rows: [], errors: [], aiFailed: true });
  }
  return NextResponse.json({
    ok: true,
    rows: rows.map((r, i) => ({
      ward_name: r.wardName,
      financial_year: r.financialYear || financialYear,
      category: r.category,
      sub_category: r.subCategory || "General",
      allocated_amount: Number(r.allocatedAmount) || 0,
      spent_amount: Number(r.spentAmount) || 0,
      project_name: r.projectName || "",
      project_status: r.projectStatus || "Planned",
      _line: i + 1,
      _wardId: matchWard(r.wardName, wards),
      _categoryValid: true,
    })),
    errors: [],
  });
}

const ApproveRow = z.object({
  ward_name: z.string(),
  financial_year: z.string(),
  category: z.string(),
  sub_category: z.string().default("General"),
  allocated_amount: z.coerce.number().min(0),
  spent_amount: z.coerce.number().min(0).default(0),
  project_name: z.string().default(""),
  project_status: z.string().default("Planned"),
  _wardId: z.string().min(1, "Every row must match a ward before approval"),
});

const ApproveBody = z.object({
  rows: z.array(ApproveRow).min(1).max(500),
  fileName: z.string().default("upload"),
  sourceType: z.enum(["csv", "pdf"]).default("csv"),
  financialYear: z.string().default("2025-26"),
});

export async function PUT(req: Request) {
  let body: z.infer<typeof ApproveBody>;
  try {
    body = ApproveBody.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid approval payload.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  if (!isSupabaseConfiguredServer) {
    return NextResponse.json({ ok: true, inserted: body.rows.length, demoMode: true });
  }

  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("no-service-client");

    const { data: upload } = await sb
      .from("budget_uploads")
      .insert({
        file_name: body.fileName,
        source_type: body.sourceType,
        financial_year: body.financialYear,
        extraction_status: "approved",
        row_count: body.rows.length,
      })
      .select("id")
      .single();
    const uploadId = (upload as { id: string } | null)?.id ?? null;

    let inserted = 0;
    const touchedWards = new Set<string>();
    for (const r of body.rows) {
      const { data: alloc, error } = await sb
        .from("budget_allocations")
        .insert({
          ward_id: r._wardId,
          budget_upload_id: uploadId,
          financial_year: r.financial_year,
          category: r.category,
          sub_category: r.sub_category,
          allocated_amount: r.allocated_amount,
          spent_amount: r.spent_amount,
        })
        .select("id")
        .single();
      if (error) continue;
      inserted++;
      touchedWards.add(r._wardId);
      if (r.project_name) {
        await sb.from("projects").insert({
          ward_id: r._wardId,
          budget_allocation_id: (alloc as { id: string }).id,
          project_name: r.project_name,
          category: r.category,
          estimated_cost: r.allocated_amount,
          spent_amount: r.spent_amount,
          status: "Planned",
        });
      }
    }

    // Recalculate metrics for touched wards.
    for (const wardId of touchedWards) {
      const [{ data: reports }, { data: budgets }] = await Promise.all([
        sb.from("citizen_reports").select("ward_id, category, urgency_score, created_at, status, original_text, translated_text").eq("ward_id", wardId),
        sb.from("budget_allocations").select("ward_id, category, allocated_amount, spent_amount").eq("ward_id", wardId),
      ]);
      const metrics = recalculateMetricsPure(reports ?? [], budgets ?? [], body.financialYear);
      for (const m of metrics) {
        await sb.from("ward_category_metrics").upsert(
          { ...m, calculated_at: new Date().toISOString() },
          { onConflict: "ward_id,category,period" },
        );
      }
    }

    return NextResponse.json({ ok: true, inserted });
  } catch {
    return NextResponse.json({ ok: false, error: "Approval write failed." }, { status: 500 });
  }
}

async function listWards(): Promise<Array<{ id: string; ward_name: string; ward_no: number | null }>> {
  if (!isSupabaseConfiguredServer) {
    const { demoWards } = await import("@/lib/demo-data");
    return demoWards.map((w) => ({ id: w.id, ward_name: w.ward_name, ward_no: w.ward_no }));
  }
  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("x");
    const { data } = await sb.from("wards").select("id, ward_name, ward_no");
    return (data ?? []) as Array<{ id: string; ward_name: string; ward_no: number | null }>;
  } catch {
    const { demoWards } = await import("@/lib/demo-data");
    return demoWards.map((w) => ({ id: w.id, ward_name: w.ward_name, ward_no: w.ward_no }));
  }
}
