import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  Upload,
  Wallet,
  GitCompareArrows,
  Lightbulb,
  HardHat,
  Activity,
  TriangleAlert,
  Database,
} from "lucide-react";
import { ADMIN_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: Inbox },
  { href: "/admin/mismatch", label: "Mismatch", icon: GitCompareArrows },
  { href: "/admin/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/admin/projects", label: "Projects", icon: HardHat },
  { href: "/admin/impact", label: "Impact", icon: Activity },
  { href: "/admin/budgets", label: "Budgets", icon: Wallet },
  { href: "/admin/budget-upload", label: "Budget upload", icon: Upload },
];

export function AdminShell({
  children,
  active,
  demoMode,
  userEmail,
}: {
  children: React.ReactNode;
  active: string;
  demoMode: boolean;
  userEmail?: string | null;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-slateink dark:text-paper/60">
          Official workspace {userEmail ? `· ${userEmail}` : "· demo session"}
        </p>
        <Link href="/" className="text-xs font-medium text-signal hover:underline">
          ← Public site
        </Link>
      </div>

      {demoMode && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-gold/40 bg-[#FBF4E0] px-4 py-3 text-sm dark:bg-gold/10">
          <Database className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
          <p>
            <strong>Demo data mode.</strong> Supabase isn&apos;t connected, so you&apos;re viewing
            the seeded Sampurna District story locally. Reads work; demo write receipts are not
            persisted. Production requires Supabase and an official account.
          </p>
        </div>
      )}

      <nav className="sticky top-16 z-30 -mx-4 mt-4 overflow-x-auto border-y border-ink/10 bg-paper-50/95 px-4 backdrop-blur dark:border-paper/10 dark:bg-ink-950/95" aria-label="Admin">
        <ul className="flex min-w-max gap-1 py-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.href;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                      : "text-slateink hover:bg-ink/5 dark:text-paper/75 dark:hover:bg-paper/10",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="animate-fade-up">{children}</div>

      <p className="mt-10 flex items-start gap-2 border-t border-ink/10 pt-4 text-xs text-slateink dark:border-paper/10 dark:text-paper/60">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {ADMIN_DISCLAIMER}
      </p>
    </div>
  );
}
