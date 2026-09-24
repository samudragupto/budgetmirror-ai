import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Refresh SSR cookies and block unauthorized admin pages before RSC renders them. */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|pdf|csv)$).*)"],
};
