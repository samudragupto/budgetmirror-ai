import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { createClient, isSupabaseConfiguredServer } from "@/lib/supabase/server";

/**
 * Admin protection: when Supabase is configured, require an authenticated
 * user with an admin/policymaker role; otherwise run the demo workspace.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let demoMode = true;
  let email: string | null = null;
  let active = "/admin/dashboard";

  if (isSupabaseConfiguredServer) {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) redirect("/admin/login");
    // Role check: profiles table (admin/policymaker) or user_metadata fallback.
    const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
    const role =
      (profile as { role?: string } | null)?.role ??
      (user.user_metadata?.role as string | undefined) ??
      null;
    if (role && role !== "admin" && role !== "policymaker") redirect("/admin/login?error=forbidden");
    demoMode = false;
    email = user.email ?? null;
  }

  // Active nav is refined per-page via searchParams-free approach: pages render
  // their own shell? No — keep single shell; infer from headers is overkill.
  // Instead each admin page wraps content assuming shell nav highlights by URL.
  // We pass a best-effort empty and let links use aria-current via client? Simpler:
  // AdminShell links highlight by comparing `active`; pages set it through a
  // client wrapper. To avoid complexity, AdminShell is rendered here and each
  // page exports its path via a tiny client component... 
  //
  // Pragmatic call: read the active path at runtime with a client hook inside
  // AdminShell? AdminShell is a server component here. We resolve `active` by
  // importing headers() — Next 15 makes headers() async.
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const path = h.get("x-pathname") ?? h.get("referer") ?? "";
    const match = path.match(/\/admin\/[a-z-]+/);
    if (match) active = match[0];
  } catch {
    /* keep default */
  }

  return <AdminShell active={active} demoMode={demoMode} userEmail={email}>{children}</AdminShell>;
}
