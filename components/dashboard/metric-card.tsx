import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "teal",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: "teal" | "coral" | "gold" | "ink";
}) {
  const accentCls = {
    teal: "bg-signal/10 text-signal dark:bg-signal/20 dark:text-emerald-300",
    coral: "bg-coral/10 text-coral dark:bg-coral/20 dark:text-orange-300",
    gold: "bg-gold/15 text-[#7A5B12] dark:bg-gold/20 dark:text-gold-light",
    ink: "bg-ink/8 text-ink dark:bg-paper/10 dark:text-paper",
  }[accent];
  return (
    <Card className="ledger-card">
      <CardContent className="flex items-start gap-3 p-4 pt-4">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", accentCls)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-medium uppercase tracking-wider text-slateink dark:text-paper/60">
            {label}
          </span>
          <span className="block truncate font-serif text-2xl font-bold tracking-tight">{value}</span>
          {sub && <span className="block text-xs text-slateink/80 dark:text-paper/60">{sub}</span>}
        </span>
      </CardContent>
    </Card>
  );
}

/** Sticky strip of headline figures used above dashboards. */
export function MetricStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink/12 bg-ink/10 dark:border-paper/15 dark:bg-paper/15 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="bg-white px-4 py-3 dark:bg-ink-800">
          <dt className="text-[11px] font-medium uppercase tracking-wider text-slateink dark:text-paper/60">{i.label}</dt>
          <dd className="font-mono text-lg font-bold">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
