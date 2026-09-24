import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { PROJECT_STATUSES } from "@/lib/constants";

const Body = z.object({ status: z.enum(PROJECT_STATUSES) });

/** PATCH /api/projects/:id/status — move a project along its lifecycle. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }
  if (!isSupabaseConfiguredServer) {
    return NextResponse.json({ ok: true, demoMode: true });
  }
  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("x");
    const patch: Record<string, unknown> = { status: body.status };
    if (body.status === "Impact Verified" || body.status === "Completed") {
      patch.actual_completion = new Date().toISOString().slice(0, 10);
    }
    const { error } = await sb.from("projects").update(patch).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Status update failed." }, { status: 500 });
  }
}
