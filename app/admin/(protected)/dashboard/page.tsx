import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, TriangleAlert, BadgeCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemandBudgetChartClient } from "@/components/dashboard/demand-budget-chart.client";
import { WardMapClient } from "@/components/dashboard/ward-map.client";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MismatchTable } from "@/components/dashboard/mismatch-table";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { toChartData } from "@/lib/chart-data";
import { getMetrics, getReports, getWards } from "@/lib/server-data";
import { buildRecommendations } from "@/lib/recommendations";
import { CATEGORY_SHORT } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import type { WardHotspot } from "@/components/dashboard/ward-map";

export const metadata: Metadata = { title: "Official dashboard" };


export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ward?: string }>;
}) {
  const { ward: wardParam } = await searchParams;
  const [{ data: metrics }, { data: reports }, { data: wards }] = await Promise.all([
    getMetrics(),
    getReports(500),
    getWards(),
  ]);

  const fallbackWard = wards.find((w) => w.ward_no === 5) ?? wards[0];
  const wardId = wards.some((w) => w.id === wardParam) ? (wardParam as string) : (fallbackWard?.id ?? "ward-5");
  const ward = wards.find((w) => w.id === wardId);
  const wardMetrics = metrics
    .filter((m) => m.ward_id === wardId)
    .sort((a, b) => b.demand_score - a.demand_score);
  const chartData = toChartData(wardMetrics, (c) => CATEGORY_SHORT[c as keyof typeof CATEGORY_SHORT] ?? c);

  const critical = metrics.filter((m) => (m.alignment_score ?? 100) < 40);
  const totalAllocated = metrics.reduce((s, m) => s + m.allocated_amount, 0);
  const totalReports = metrics.reduce((s, m) => s + m.report_count, 0);
  const topRecs = buildRecommendations(metrics).slice(0, 3);

  const hotspots: WardHotspot[] = wards.map((w) => {
    const wm = metrics.filter((m) => m.ward_id === w.id);
    const worst = wm.reduce<number | null>(
      (acc, m) => (m.alignment_score === null ? acc : acc === null ? m.alignment_score : Math.min(acc, m.alignment_score)),
      null,
    );
    const top = [...wm].sort((a, b) => b.demand_score - a.demand_score)[0];
    return { ...w, reportCount: wm.reduce((s, m) => s + m.report_count, 0), worstAlignment: worst, topCategory: top?.category ?? null };
  });

  const newReports = reports.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">District mirror</h1>
          <p className="mt-1 text-slateink dark:text-paper/70">
            {ward ? `${ward.ward_no ? `Ward ${ward.ward_no} · ` : ""}${ward.ward_name}` : "All wards"} · FY 2025-26 · deterministic scores
          </p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <label htmlFor="ward" className="text-sm font-medium">Ward</label>
          <select id="ward" name="ward" defaultValue={wardId} className="h-10 rounded-md border border-ink/20 bg-white px-3 text-sm dark:border-paper/25 dark:bg-ink-950">
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.ward_no ? `Ward ${w.ward_no} — ${w.ward_name}` : w.ward_name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">View</Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={FileText} label="Reports mirrored" value={totalReports.toLocaleString("en-IN")} sub={`${newReports} new in sample`} accent="ink" />
        <MetricCard icon={Wallet} label="Budget on ledger" value={formatINR(totalAllocated, { compact: true })} sub="FY 2025-26 allocations" accent="gold" />
        <MetricCard icon={TriangleAlert} label="Critical mismatches" value={String(critical.length)} sub="Alignment below 40" accent="coral" />
        <MetricCard icon={BadgeCheck} label="Top priority" value={topRecs[0] ? String(topRecs[0].priority_score) : "—"} sub={topRecs[0]?.category ?? "No data"} accent="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="ledger-card">
          <CardHeader>
            <CardTitle>Demand vs budget share</CardTitle>
            <CardDescription>
              {ward?.ward_name ?? "Ward"} · Teal = demand (0–100) · Gold = budget share (%). Water 93 vs 11% is the gap to close.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemandBudgetChartClient data={chartData} />
          </CardContent>
        </Card>
        <Card className="ledger-card">
          <CardHeader>
            <CardTitle>Ward hotspots</CardTitle>
            <CardDescription>Size = report volume · colour = worst alignment</CardDescription>
          </CardHeader>
          <CardContent>
            <WardMapClient wards={hotspots} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Critical mismatches</CardTitle>
              <CardDescription>Alignment below 40 — funding attention required.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/mismatch">Open intelligence page <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MismatchTable metrics={[...critical].sort((a, b) => (a.alignment_score ?? 0) - (b.alignment_score ?? 0))} />
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl font-bold">Top 3 priority actions</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/recommendations">All recommendations <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {topRecs.map((r, i) => (
            <RecommendationCard key={r.id} rec={r} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
