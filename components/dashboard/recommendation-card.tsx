import { Quote } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScorePill } from "@/components/dashboard/score-pill";
import type { Recommendation } from "@/types/metrics";

/**
 * Every recommendation shows: demand score, budget share, alignment,
 * reason, data source, completeness note (+ optional AI explanation).
 */
export function RecommendationCard({ rec, rank }: { rec: Recommendation; rank?: number }) {
  return (
    <Card className="ledger-card">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {rank !== undefined && <Badge variant="gold">Priority #{rank}</Badge>}
          <Badge>{rec.ward_name}</Badge>
          <Badge variant="teal">{rec.category}</Badge>
          <span className="ml-auto"><ScorePill score={rec.priority_score} label={`Priority score ${rec.priority_score}`} /></span>
        </div>
        <CardTitle className="mt-2 text-2xl">{rec.title}</CardTitle>
        <CardDescription>{rec.rationale}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-ink/12 bg-ink/10 text-center dark:border-paper/15 dark:bg-paper/15">
          <div className="bg-white px-2 py-3 dark:bg-ink-800">
            <dt className="text-[11px] uppercase tracking-wider text-slateink dark:text-paper/60">Demand</dt>
            <dd className="font-mono text-xl font-bold">{rec.demand_score}</dd>
          </div>
          <div className="bg-white px-2 py-3 dark:bg-ink-800">
            <dt className="text-[11px] uppercase tracking-wider text-slateink dark:text-paper/60">Budget share</dt>
            <dd className="font-mono text-xl font-bold">{rec.budget_share_pct}%</dd>
          </div>
          <div className="bg-white px-2 py-3 dark:bg-ink-800">
            <dt className="text-[11px] uppercase tracking-wider text-slateink dark:text-paper/60">Alignment</dt>
            <dd className="font-mono text-xl font-bold">{rec.alignment_score ?? "N/A"}</dd>
          </div>
        </dl>

        <div className="rounded-md border-l-2 border-gold bg-paper-100/70 p-3 text-sm dark:bg-paper/5">
          <p className="font-semibold">Suggested move</p>
          <p className="mt-1">{rec.suggested_reallocation}</p>
          <p className="mt-2"><span className="font-semibold">Beneficiaries:</span> {rec.beneficiaries}</p>
        </div>

        {rec.ai_explanation && (
          <figure className="rounded-md bg-ink/[0.03] p-4 dark:bg-paper/5">
            <Quote className="size-4 text-signal" aria-hidden="true" />
            <blockquote className="mt-1 font-serif text-lg italic leading-snug">
              {rec.ai_explanation}
            </blockquote>
            <figcaption className="mt-1 text-xs text-slateink dark:text-paper/60">— AI-drafted explanation, scores remain deterministic</figcaption>
          </figure>
        )}

        <div className="space-y-1 text-xs text-slateink dark:text-paper/60">
          <p><span className="font-semibold">Why this score:</span> {rec.reason}</p>
          <p><span className="font-semibold">Data source:</span> {rec.data_source}</p>
          <p><span className="font-semibold">Completeness:</span> {rec.completeness_note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
