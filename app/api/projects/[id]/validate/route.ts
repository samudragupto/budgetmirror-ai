import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";

const Body = z.object({
  rating: z.number().int().min(1).max(5),
  issueResolved: z.enum(["yes", "partial", "no"]),
  feedback: z.string().max(500).optional(),
});

/** POST /api/projects/:id/validate — anonymous-friendly citizen validation. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid validation payload." }, { status: 400 });
  }
  if (!isSupabaseConfiguredServer) {
    return NextResponse.json({ ok: true, demoMode: true });
  }
  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("x");
    const { error } = await sb.from("project_validations").insert({
      project_id: id,
      rating: body.rating,
      issue_resolved: body.issueResolved,
      feedback: body.feedback ?? null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save validation." }, { status: 500 });
  }
}
