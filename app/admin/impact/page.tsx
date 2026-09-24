import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScorePill, ScoreBar } from "@/components/dashboard/score-pill";
import { getProjects, getValidations } from "@/lib/server-data";
import { computeImpactScore, ratingToSatisfaction, resolutionToScore } from "@/lib/scoring";

export const metadata: Metadata = { title: "Impact verification" };

export default async function ImpactPage() {
  const [{ data: projects }, { data: validations }] = await Promise.all([getProjects(), getValidations()]);

  const rows = projects.map((p) => {
    const vals = validations.filter((v) => v.project_id === p.id);
    const avg = vals.length ? vals.reduce((s, v) => s + v.rating, 0) / vals.length : null;
    const resolution = resolutionToScore(
      vals.filter((v) => v.issue_resolved === "yes").length,
      vals.filter((v) => v.issue_resolved === "partial").length,
      vals.filter((v) => v.issue_resolved === "no").length,
    );
    const satisfaction = ratingToSatisfaction(avg);
    const complaintReduction = p.status === "Impact Verified" ? 70 : p.status === "Completed" || p.status === "Citizen Validation Pending" ? 40 : 10;
    const onTime = p.status === "Delayed" ? 20 : p.status === "Needs Review" ? 35 : 70;
    const impact = vals.length ? computeImpactScore({ resolution, satisfaction, complaintReduction, onTimeInBudget: onTime }) : null;
    return { p, vals, avg, resolution, satisfaction, impact };
  }).sort((a, b) => (b.impact ?? -1) - (a.impact ?? -1));

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Impact verification</h1>
        <p className="mt-1 max-w-2xl text-slateink dark:text-paper/70">
          Impact = 0.40×resolution confirmations + 0.25×satisfaction + 0.20×complaint reduction + 0.15×on-time/in-budget.
          Citizen validations carry the heaviest weight — deliberately.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map(({ p, vals, avg, resolution, satisfaction, impact }) => (
          <Card key={p.id} className="ledger-card">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="teal">{p.category}</Badge>
                <Badge>{p.status}</Badge>
                <span className="ml-auto"><ScorePill score={impact} label={impact === null ? "No impact score yet" : `Impact score ${impact}`} /></span>
              </div>
              <CardTitle className="mt-2">{p.project_name}</CardTitle>
              <CardDescription>{vals.length} validations{avg !== null ? ` · ★ ${avg.toFixed(1)} avg` : " · no ratings yet"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><p className="flex justify-between"><span>Resolution confirmations (40%)</span><span className="font-mono font-bold">{resolution}</span></p><ScoreBar value={resolution} className="mt-1" /></div>
                <div><p className="flex justify-between"><span>Satisfaction from ratings (25%)</span><span className="font-mono font-bold">{satisfaction}</span></p><ScoreBar value={satisfaction} className="mt-1" /></div>
              </div>
              {impact !== null && impact < 40 && (
                <p className="rounded-md border border-coral/30 bg-coral-50 p-3 text-sm dark:bg-coral/10">
                  <strong>Needs review:</strong> citizens report this project didn&apos;t resolve the issue. Consider a field audit before marking complete.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
