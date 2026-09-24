"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/report", label: "Report a need" },
  { href: "/transparency", label: "Transparency" },
  { href: "/projects", label: "Projects" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper-50/95 backdrop-blur dark:border-paper/10 dark:bg-ink-950/95">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="BudgetMirror AI home">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-gold-light dark:bg-paper dark:text-ink">
            <Scale className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold tracking-tight">BudgetMirror</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-signal dark:text-emerald-300">
              Sampurna District
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === n.href
                  ? "bg-ink/8 text-ink dark:bg-paper/10 dark:text-paper"
                  : "text-slateink hover:bg-ink/5 dark:text-paper/75 dark:hover:bg-paper/10",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {!isAdmin && (
            <Button asChild variant="ink" size="sm" className="hidden sm:inline-flex">
              <Link href="/admin/dashboard">Official login</Link>
            </Button>
          )}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-ink/5 md:hidden dark:hover:bg-paper/10"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-ink/10 px-4 py-2 md:hidden dark:border-paper/10" aria-label="Mobile">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium",
                pathname === n.href ? "bg-ink/8 dark:bg-paper/10" : "",
              )}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/admin/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2.5 text-sm font-medium text-signal"
          >
            Official login →
          </Link>
        </nav>
      )}
    </header>
  );
}
