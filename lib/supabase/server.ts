import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfiguredServer =
  url.length > 0 && !url.includes("example") && anon.length > 0 && !anon.startsWith("dummy");

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Auth-aware server client (reads session cookies). Next 15: cookies() is async. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    url || "https://example.supabase.co",
    anon || "dummy-anon-key-for-ci",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach((c: CookieToSet) =>
              cookieStore.set(c.name, c.value, c.options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session.
          }
        },
      },
    },
  );
}

/** Service-role client for trusted server-side writes. Never expose to the browser. */
export async function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceKey || serviceKey.startsWith("dummy") || !isSupabaseConfiguredServer) {
    return null;
  }
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  return createAdminClient(url, serviceKey, { auth: { persistSession: false } });
}
