import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemandBudgetChartClient } from "@/components/dashboard/demand-budget-chart.client";
import { Badge } from "@/components/ui/badge";
import { MismatchTable } from "@/components/dashboard/mismatch-table";
import { ScorePill } from "@/components/dashboard/score-pill";
import { toChartData } from "@/lib/chart-data";
import { getMetrics, getWards } from "@/lib/server-data";
import { mismatchLabel } from "@/lib/scoring";
import { CATEGORIES, CATEGORY_SHORT, MISMATCH_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mismatch intelligence" };


const LABEL_TONE: Record<string, "coral" | "gold" | "teal" | "slate"> = {
  [MISMATCH_LABELS.UNDERFUNDED]: "coral",
  [MISMATCH_LABELS.OVERSPENDING]: "gold",
  [MISMATCH_LABELS.ALIGNED]: "teal",
  [MISMATCH_LABELS.MONITOR]: "slate",
};

export default async function MismatchPage({
  searchParams,
}: {
  searchParams: Promise<{ ward?: string }>;
}) {
  const { ward: wardParam } = await searchParams;
  const [{ data: metrics }, { data: wards }] = await Promise.all([getMetrics(), getWards()]);
  const fallbackWard = wards.find((w) => w.ward_no === 5) ?? wards[0];
  const wardId = wards.some((w) => w.id === wardParam) ? (wardParam as string) : (fallbackWard?.id ?? "ward-5");
  const ward = wards.find((w) => w.id === wardId);
  const wardMetrics = metrics.filter((m) => m.ward_id === wardId).sort((a, b) => b.demand_score - a.demand_score);
  const chartData = toChartData(wardMetrics, (c) => CATEGORY_SHORT[c as keyof typeof CATEGORY_SHORT] ?? c);
  const allSorted = [...metrics].sort((a, b) => (a.alignment_score ?? 999) - (b.alignment_score ?? 999));

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Mismatch intelligence</h1>
          <p className="mt-1 max-w-2xl text-slateink dark:text-paper/70">
            Where citizen demand and budget share diverge. Alignment = max(0, 100 − |demand share − budget share| × 100).
          </p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <label htmlFor="ward" className="text-sm font-medium">Ward</label>
          <select id="ward" name="ward" defaultValue={wardId} className="h-10 rounded-md border border-ink/20 bg-white px-3 text-sm dark:border-paper/25 dark:bg-ink-950">
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.ward_no ? `Ward ${w.ward_no} — ${w.ward_name}` : w.ward_name}</option>
            ))}
          </select>
          <button type="submit" className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-paper dark:bg-paper dark:text-ink">View</button>
        </form>
      </div>

      {/* Heat strip: one cell per category for the selected ward */}
      <Card className="ledger-card">
        <CardHeader>
          <CardTitle>{ward?.ward_name ?? "Ward"} · category heat strip</CardTitle>
          <CardDescription>Each cell = demand score, budget share, alignment. Coral cells need funding attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => {
              const m = wardMetrics.find((x) => x.category === c);
              if (!m) {
                return (
                  <div key={c} className="rounded-md border border-dashed border-ink/20 p-3 dark:border-paper/20">
                    <p className="text-sm font-semibold">{CATEGORY_SHORT[c]}</p>
                    <p className="mt-1 font-mono text-xs text-slateink/70 dark:text-paper/50">no data</p>
                  </div>
                );
              }
              const label = mismatchLabel(m.demand_score, m.budget_share === null ? null : Math.round(m.budget_share * 100));
              return (
                <div key={c} className="rounded-md border border-ink/12 bg-white p-3 shadow-sm dark:border-paper/15 dark:bg-ink-950">
                  <p className="truncate text-sm font-semibold" title={c}>{CATEGORY_SHORT[c]}</p>
                  <p className="mt-1 font-mono text-xs">D {m.demand_score} · B {m.budget_share === null ? "N/A" : `${Math.round(m.budget_share * 100)}%`}</p>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <ScorePill score={m.alignment_score} />
                  </div>
                  <Badge variant={LABEL_TONE[label]} className={cn("mt-2 max-w-full whitespace-normal text-center text-[10px] leading-tight")}>{label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ward?.ward_name ?? "Ward"} · demand vs budget</CardTitle>
          <CardDescription>The hero visual, scoped to this ward.</CardDescription>
        </CardHeader>
        <CardContent>
          <DemandBudgetChartClient data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All wards · ranked by alignment</CardTitle>
          <CardDescription>Lowest alignment first. Click a ward to scope the heat strip.</CardDescription>
        </CardHeader>
        <CardContent>
          <MismatchTable metrics={allSorted} />
        </CardContent>
      </Card>

      <Card className="border-signal/30">
        <CardContent className="p-5 text-sm">
          <p><strong>How to read this page.</strong> Demand share = this category&apos;s demand ÷ ward total demand. Budget share = its allocation ÷ ward total. A 69-point gap (Ward 5 water: 80% of demand, 11% of money) yields alignment <strong>31</strong> — critical. Lighting shows the mirror image: 3% of demand, 54% of money.</p>
        </CardContent>
      </Card>
    </div>
  );
}
