import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusTimeline } from "@/components/dashboard/status-timeline";
import { ProjectStatusEditor } from "@/components/dashboard/project-status-editor";
import { getProjects, getValidations, getWards } from "@/lib/server-data";
import { computeImpactScore, ratingToSatisfaction, resolutionToScore } from "@/lib/scoring";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage projects" };

export default async function AdminProjectsPage() {
  const [{ data: projects }, { data: validations }, { data: wards }] = await Promise.all([
    getProjects(),
    getValidations(),
    getWards(),
  ]);
  const wardName = (id: string | null) => {
    const w = wards.find((x) => x.id === id);
    return w ? `${w.ward_no ? `Ward ${w.ward_no} · ` : ""}${w.ward_name}` : "—";
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Projects</h1>
        <p className="mt-1 text-slateink dark:text-paper/70">
          Lifecycle control: Planned → Funded → In Progress → Delayed → Completed → Citizen Validation Pending → Impact Verified / Needs Review.
        </p>
      </div>

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
                  {impact !== null && <Badge variant="gold">Impact {impact}</Badge>}
                  <span className="ml-auto font-mono text-sm">{p.estimated_cost ? formatINR(p.estimated_cost, { compact: true }) : ""}</span>
                </div>
                <CardTitle className="mt-2">
                  <Link href={`/projects/${p.id}`} className="hover:text-signal hover:underline">{p.project_name}</Link>
                </CardTitle>
                {p.description && <CardDescription>{p.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusTimeline status={p.status} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slateink dark:text-paper/60">
                    {vals.length} validations{avg !== null ? ` · ★ ${avg.toFixed(1)} avg` : ""}
                  </p>
                  <ProjectStatusEditor id={p.id} status={p.status} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spend ledger</CardTitle>
          <CardDescription>Estimated vs spent per project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Utilisation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const util = p.estimated_cost ? Math.round(((p.spent_amount ?? 0) / p.estimated_cost) * 100) : null;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.project_name}</TableCell>
                    <TableCell className="text-right font-mono">{p.estimated_cost ? formatINR(p.estimated_cost) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{p.spent_amount ? formatINR(p.spent_amount) : "—"}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{util === null ? "—" : `${util}%`}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
