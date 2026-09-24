import Link from "next/link";
import { ADMIN_DISCLAIMER, CITIZEN_PRIVACY_NOTE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-gold/60 bg-ink text-paper/85 dark:bg-ink-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl font-bold text-paper">BudgetMirror AI</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-paper/70">
            A public ledger for civic needs, budgets, and outcomes. Spending made visible,
            mismatches explained, outcomes verified — by citizens, for citizens.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-paper hover:underline" href="/report">Report a need</Link></li>
            <li><Link className="hover:text-paper hover:underline" href="/transparency">Transparency dashboard</Link></li>
            <li><Link className="hover:text-paper hover:underline" href="/projects">Project directory</Link></li>
            <li><Link className="hover:text-paper hover:underline" href="/admin/dashboard">Official dashboard</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">Trust notes</p>
          <p className="mt-3 leading-relaxed text-paper/70">{CITIZEN_PRIVACY_NOTE}</p>
          <p className="mt-2 leading-relaxed text-paper/70">{ADMIN_DISCLAIMER}</p>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <span>BudgetMirror AI · A Digital Public Good prototype · MIT licensed</span>
          <span className="font-mono">Sampurna District · FY 2025-26 · Scores are deterministic</span>
        </div>
      </div>
    </footer>
  );
}
