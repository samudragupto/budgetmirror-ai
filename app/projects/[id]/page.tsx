import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/dashboard/status-timeline";
import { ScorePill } from "@/components/dashboard/score-pill";
import { ValidationForm } from "@/components/citizen/validation-form";
import { getProject } from "@/lib/server-data";
import { computeImpactScore, ratingToSatisfaction, resolutionToScore } from "@/lib/scoring";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Project detail" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, validations, wardName, demoMode } = await getProject(id);
  if (!project) notFound();

  const avg = validations.length ? validations.reduce((s, v) => s + v.rating, 0) / validations.length : null;
  const yes = validations.filter((v) => v.issue_resolved === "yes").length;
  const partial = validations.filter((v) => v.issue_resolved === "partial").length;
  const no = validations.filter((v) => v.issue_resolved === "no").length;
  const impact = validations.length
    ? computeImpactScore({
        resolution: resolutionToScore(yes, partial, no),
        satisfaction: ratingToSatisfaction(avg),
        complaintReduction: project.status === "Impact Verified" ? 70 : project.status === "Completed" ? 40 : 10,
        onTimeInBudget: project.status === "Delayed" ? 20 : 70,
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Link href="/projects" className="text-sm font-medium text-signal hover:underline">← All projects</Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {wardName && <Badge>{wardName}</Badge>}
          <Badge variant="teal">{project.category}</Badge>
          {project.estimated_cost ? <span className="font-mono text-sm font-bold">{formatINR(project.estimated_cost)}</span> : null}
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">{project.project_name}</h1>
        {project.description && <p className="mt-2 text-slateink dark:text-paper/70">{project.description}</p>}
      </div>

      <Card>
        <CardHeader><CardTitle>Delivery lifecycle</CardTitle></CardHeader>
        <CardContent><StatusTimeline status={project.status} /></CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="ledger-card">
          <CardHeader>
            <CardTitle>Impact score</CardTitle>
            <CardDescription>0.40×resolution + 0.25×satisfaction + 0.20×complaint reduction + 0.15×on-time/in-budget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScorePill score={impact} label={impact === null ? "No validations yet" : `Impact score ${impact}`} />
            <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
              <div className="rounded border border-ink/10 p-2 dark:border-paper/15"><dt className="font-sans text-xs">Resolved</dt><dd className="font-bold">{yes} yes · {partial} partial · {no} no</dd></div>
              <div className="rounded border border-ink/10 p-2 dark:border-paper/15"><dt className="font-sans text-xs">Avg rating</dt><dd className="font-bold">{avg !== null ? `★ ${avg.toFixed(1)}` : "—"}</dd></div>
              <div className="rounded border border-ink/10 p-2 dark:border-paper/15"><dt className="font-sans text-xs">Spent</dt><dd className="font-bold">{project.spent_amount ? formatINR(project.spent_amount, { compact: true }) : "—"}</dd></div>
              <div className="rounded border border-ink/10 p-2 dark:border-paper/15"><dt className="font-sans text-xs">Planned end</dt><dd className="font-bold">{project.planned_end ? formatDate(project.planned_end) : "—"}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validate from the ground</CardTitle>
            <CardDescription>Anonymous. Your rating moves public money conversations.</CardDescription>
          </CardHeader>
          <CardContent>
            <ValidationForm projectId={project.id} demoMode={demoMode} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Citizen validations ({validations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {validations.length === 0 ? (
            <p className="text-sm text-slateink dark:text-paper/60">No validations yet — be the first to report ground truth.</p>
          ) : (
            <ul className="divide-y divide-ink/8 dark:divide-paper/10">
              {validations.map((v) => (
                <li key={v.id} className="py-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold">★ {v.rating}</span>
                    <Badge variant={v.issue_resolved === "yes" ? "teal" : v.issue_resolved === "no" ? "coral" : "gold"}>{v.issue_resolved}</Badge>
                    <span className="text-xs text-slateink dark:text-paper/60">{formatDate(v.created_at)}</span>
                  </p>
                  {v.feedback && <p className="mt-1 text-sm">“{v.feedback}”</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
