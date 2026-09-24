import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminAccess } from "@/lib/admin-auth";

// Never prerender protected RSC payloads, including builds without Supabase config.
export const dynamic = "force-dynamic";

/** Only workspace pages are in this route group; /admin/login is not a child. */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") redirect("/admin/access-denied");

  let active = "/admin/dashboard";
  // Nav highlighting is best-effort; authorization above never depends on headers.
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const path = h.get("x-pathname") ?? h.get("referer") ?? "";
    const match = path.match(/\/admin\/[a-z-]+/);
    if (match) active = match[0];
  } catch {
    /* keep default */
  }

  return (
    <AdminShell
      active={active}
      demoMode={access.status === "demo"}
      userEmail={access.status === "authorized" ? access.email : null}
    >
      {children}
    </AdminShell>
  );
}
