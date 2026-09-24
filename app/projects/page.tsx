import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/states";
import { StatusTimeline } from "@/components/dashboard/status-timeline";
import { getProjects, getValidations, getWards } from "@/lib/server-data";
import { computeImpactScore, ratingToSatisfaction, resolutionToScore } from "@/lib/scoring";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Project directory" };

export default async function ProjectsPage() {
  const [{ data: projects }, { data: validations }, { data: wards }] = await Promise.all([
    getProjects(),
    getValidations(),
    getWards(),
  ]);
  const wardName = (id: string | null) => {
    const w = wards.find((x) => x.id === id);
    return w ? `${w.ward_no ? `Ward ${w.ward_no} · ` : ""}${w.ward_name}` : "District";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal dark:text-emerald-300">Ground truth · Public directory</p>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">Projects &amp; their proof</h1>
        <p className="mt-2 max-w-2xl text-slateink dark:text-paper/70">
          Every project carries a public lifecycle and a citizen impact score. Only validations
          from the ground can move a project to <em>Impact Verified</em>.
        </p>
      </div>

      {projects.length === 0 && (
        <EmptyState title="No projects published yet" hint="Once officials approve budget uploads, linked projects will appear here." />
      )}

      <div className="grid gap-4">
        {projects.map((p) => {
          const vals = validations.filter((v) => v.project_id === p.id);
          const avg = vals.length ? vals.reduce((s, v) => s + v.rating, 0) / vals.length : null;
          const impact = vals.length
            ? computeImpactScore({
                resolution: resolutionToScore(vals.filter((v) => v.issue_resolved === "yes").length, vals.filter((v) => v.issue_resolved === "partial").length, vals.filter((v) => v.issue_resolved === "no").length),
                satisfaction: ratingToSatisfaction(avg),
                complaintReduction: p.status === "Impact Verified" ? 70 : p.status === "Completed" ? 40 : 10,
                onTimeInBudget: p.status === "Delayed" ? 20 : 70,
              })
            : null;
          return (
            <Card key={p.id} className="ledger-card">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{wardName(p.ward_id)}</Badge>
                  <Badge variant="teal">{p.category}</Badge>
                  {impact !== null && <Badge variant={impact >= 60 ? "teal" : impact >= 40 ? "gold" : "coral"}>Impact {impact}</Badge>}
                  {p.estimated_cost ? <span className="ml-auto font-mono text-sm font-bold">{formatINR(p.estimated_cost, { compact: true })}</span> : null}
                </div>
                <CardTitle className="mt-2 text-2xl">
                  <Link href={`/projects/${p.id}`} className="hover:text-signal hover:underline">{p.project_name}</Link>
                </CardTitle>
                {p.description && <CardDescription>{p.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusTimeline status={p.status} />
                <p className="flex items-center justify-between text-sm">
                  <span className="text-slateink dark:text-paper/60">{vals.length} citizen validation{vals.length === 1 ? "" : "s"}{avg !== null ? ` · avg ★ ${avg.toFixed(1)}` : ""}</span>
                  <Link href={`/projects/${p.id}`} className="inline-flex items-center gap-1 font-medium text-signal hover:underline">
                    Validate this project <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
