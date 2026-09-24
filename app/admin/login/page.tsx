import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { isSupabaseConfiguredServer } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

/** Login is outside the protected workspace layout. Only verified officials redirect. */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await getAdminAccess();
  if (access.status === "authorized") redirect("/admin/dashboard");

  const mode = isSupabaseConfiguredServer ? "live" : access.status === "demo" ? "demo" : "unavailable";
  const { error } = await searchParams;
  return <LoginForm mode={mode} accessDenied={access.status === "forbidden" || error === "forbidden"} />;
}
