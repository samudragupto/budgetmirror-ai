import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refresh Supabase session cookies on every request.
 * Admin authz itself is enforced in app/admin/layout.tsx (server-side),
 * so demo mode (no Supabase configured) keeps working for the hackathon.
 */
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  return response ?? NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
