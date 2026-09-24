import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config";

export const isSupabaseConfiguredServer = isSupabaseConfigured;

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Auth-aware server client (reads session cookies). Next 15: cookies() is async. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl || "https://example.supabase.co",
    supabaseAnonKey || "dummy-anon-key-for-ci",
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
  return createAdminClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}
