import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScorePill } from "@/components/dashboard/score-pill";
import { MismatchTable } from "@/components/dashboard/mismatch-table";
import { MetricStrip } from "@/components/dashboard/metric-card";
import { toChartData } from "@/lib/chart-data";
import { DemandBudgetChartClient } from "@/components/dashboard/demand-budget-chart.client";
import { WardMapClient } from "@/components/dashboard/ward-map.client";
import { getMetrics, getReports, getWards } from "@/lib/server-data";
import { CATEGORY_SHORT } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { WardHotspot } from "@/components/dashboard/ward-map";

export const metadata: Metadata = { title: "Transparency board" };

export default async function TransparencyPage() {
  const [{ data: metrics }, { data: reports }, { data: wards }] = await Promise.all([
    getMetrics(),
    getReports(12),
    getWards(),
  ]);

  const ward5Id = wards.find((w) => w.ward_no === 5)?.id ?? "ward-5";
  const ward5 = metrics.filter((m) => m.ward_id === ward5Id).sort((a, b) => b.demand_score - a.demand_score);
  const chartData = toChartData(ward5, (c) => CATEGORY_SHORT[c as keyof typeof CATEGORY_SHORT] ?? c);
  const critical = [...metrics].sort((a, b) => (a.alignment_score ?? 999) - (b.alignment_score ?? 999)).slice(0, 6);

  const hotspots: WardHotspot[] = wards.map((w) => {
    const wm = metrics.filter((m) => m.ward_id === w.id);
    const worst = wm.reduce<number | null>((acc, m) => {
      if (m.alignment_score === null) return acc;
      return acc === null ? m.alignment_score : Math.min(acc, m.alignment_score);
    }, null);
    const top = [...wm].sort((a, b) => b.demand_score - a.demand_score)[0];
    return {
      ...w,
      reportCount: wm.reduce((s, m) => s + m.report_count, 0),
      worstAlignment: worst,
      topCategory: top?.category ?? null,
    };
  });

  const totalReports = metrics.reduce((s, m) => s + m.report_count, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal dark:text-emerald-300">
          Public ledger · FY 2025-26
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">Transparency board</h1>
        <p className="mt-2 max-w-2xl text-slateink dark:text-paper/70">
          Every figure below is computed from citizen reports and published allocations with
          deterministic arithmetic. No black boxes — the formulas are in the open.
        </p>
      </div>

      <MetricStrip
        items={[
          { label: "Reports mirrored", value: totalReports.toLocaleString("en-IN") },
          { label: "Wards on the board", value: String(wards.length) },
          { label: "Lowest alignment", value: critical[0]?.alignment_score !== null && critical[0]?.alignment_score !== undefined ? String(critical[0].alignment_score) : "N/A" },
          { label: "Categories tracked", value: "10" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="ledger-card">
          <CardHeader>
            <CardTitle>Ward 5: demand vs budget share</CardTitle>
            <CardDescription>Teal = citizen demand (0–100) · Gold = share of ward budget (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <DemandBudgetChartClient data={chartData} />
          </CardContent>
        </Card>
        <Card className="ledger-card">
          <CardHeader>
            <CardTitle>Ward hotspots</CardTitle>
            <CardDescription>Circle size = report volume · colour = worst alignment</CardDescription>
          </CardHeader>
          <CardContent>
            <WardMapClient wards={hotspots} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sharpest mismatches, district-wide</CardTitle>
          <CardDescription>Lowest alignment scores first — where spending and need diverge most.</CardDescription>
        </CardHeader>
        <CardContent>
          <MismatchTable metrics={critical} compact />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Recent anonymised reports</CardTitle>
              <CardDescription>Words from the field — identities never published.</CardDescription>
            </div>
            <Button asChild size="sm"><Link href="/report">Add yours</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-ink/8 dark:divide-paper/10">
            {reports.map((r) => (
              <li key={r.id} className="py-3">
                <p className="text-sm leading-relaxed">“{r.ai_summary ?? r.original_text}”</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="teal">{r.category}</Badge>
                  <span className="text-slateink dark:text-paper/60">
                    {r.ward ? `${r.ward.ward_no ? `Ward ${r.ward.ward_no} · ` : ""}${r.ward.ward_name}` : "District"} · {formatDate(r.created_at)}
                  </span>
                  <span className="font-mono">urgency {r.urgency_score ?? "—"}</span>
                  {r.tracking_id && <span className="font-mono text-slateink/70 dark:text-paper/50">{r.tracking_id}</span>}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-signal/30">
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <ScorePill score={31} label="Ward 5 water alignment 31, critical" />
          <p className="min-w-60 flex-1 text-sm">
            <strong>Reading the board:</strong> alignment 80–100 is healthy, 60–79 fair, 40–59
            strained, below 40 critical. Ward 5 water sits at <strong>31</strong> — demand 93
            against an 11% budget share.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
