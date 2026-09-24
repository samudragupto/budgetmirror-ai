import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { BriefActions } from "@/components/dashboard/brief-actions";
import { getMetrics } from "@/lib/server-data";
import { buildRecommendations } from "@/lib/recommendations";

export const metadata: Metadata = { title: "Recommendations" };

export default async function RecommendationsPage() {
  const { data: metrics } = await getMetrics();
  const recs = buildRecommendations(metrics);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Priority recommendations</h1>
          <p className="mt-1 max-w-2xl text-slateink dark:text-paper/70">
            Ranked by deterministic priority score. Each card carries its demand, budget share,
            alignment, reason, source, and completeness note — no hidden math.
          </p>
        </div>
        <BriefActions metrics={metrics} recommendations={recs} />
      </div>

      <div className="grid gap-4">
        {recs.map((r, i) => (
          <RecommendationCard key={r.id} rec={r} rank={i + 1} />
        ))}
      </div>

      <Card className="border-signal/30">
        <CardHeader>
          <CardTitle>Priority formula (auditable)</CardTitle>
          <CardDescription>Every ranking above is this arithmetic — nothing else.</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block overflow-x-auto rounded-md bg-ink p-4 font-mono text-sm text-paper dark:bg-ink-950">
            priority = 0.35×demand + 0.25×fundingGap + 0.15×severity + 0.10×vulnerable + 0.10×delay + 0.05×validation
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
