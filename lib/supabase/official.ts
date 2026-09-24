import type { SupabaseClient } from "@supabase/supabase-js";

export type OfficialAccess =
  | { status: "authorized"; email: string | null }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

/** Shared by Edge middleware and server routes: never trust cookie contents or user metadata. */
export async function verifyOfficial(sb: SupabaseClient): Promise<OfficialAccess> {
  try {
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return { status: "unauthenticated" };

    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (profileError || (profile?.role !== "admin" && profile?.role !== "policymaker")) {
      return { status: "forbidden" };
    }
    return { status: "authorized", email: data.user.email ?? null };
  } catch {
    // A failed identity/role lookup must not authorize a request.
    return { status: "unauthenticated" };
  }
}
