import "server-only";

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { verifyOfficial, type OfficialAccess } from "@/lib/supabase/official";

type AdminAccess = OfficialAccess | { status: "demo" };

/** Verify identity and database role independently of page middleware. */
export async function getAdminAccess(): Promise<AdminAccess> {
  if (!isSupabaseConfiguredServer) {
    // Keep the offline demo locally, but never make a production deployment demo-open.
    return process.env.NODE_ENV === "development" ? { status: "demo" } : { status: "unauthenticated" };
  }
  try {
    return await verifyOfficial(await createClient());
  } catch {
    return { status: "unauthenticated" };
  }
}

/** Route handlers must check this before parsing bodies or using privileged clients. */
export async function adminMutationError(): Promise<Response | null> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }
  if (access.status === "forbidden") {
    return NextResponse.json({ ok: false, error: "Official access required." }, { status: 403 });
  }
  return null;
}
