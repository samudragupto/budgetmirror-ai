import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { REPORT_STATUSES } from "@/lib/constants";

const PatchBody = z.object({
  id: z.string().min(1),
  status: z.enum(REPORT_STATUSES),
});

/** PATCH /api/reports — acknowledge / resolve / flag a report (official action). */
export async function PATCH(req: Request) {
  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
  if (!isSupabaseConfiguredServer) {
    return NextResponse.json({ ok: true, demoMode: true });
  }
  try {
    const sb = await createServiceClient();
    if (!sb) throw new Error("x");
    const { error } = await sb.from("citizen_reports").update({ status: body.status }).eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
