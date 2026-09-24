import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/states";
import { ReportRowActions } from "@/components/dashboard/report-row-actions";
import { getReports, getWards } from "@/lib/server-data";
import { CATEGORIES, REPORT_STATUSES, REPORT_STATUS_LABEL, type Category, type ReportStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Citizen reports" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ ward?: string; category?: string; urgency?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [{ data: reports }, { data: wards }] = await Promise.all([getReports(500), getWards()]);

  const wardF = sp.ward && sp.ward !== "all" ? sp.ward : null;
  const catF = sp.category && sp.category !== "all" ? sp.category : null;
  const minUrg = sp.urgency ? Number(sp.urgency) : 0;
  const statusF = sp.status && sp.status !== "all" ? (sp.status as ReportStatus) : null;
  const q = (sp.q ?? "").toLowerCase();

  const filtered = reports.filter((r) => {
    if (wardF && r.ward_id !== wardF) return false;
    if (catF && r.category !== catF) return false;
    if ((r.urgency_score ?? 0) < minUrg) return false;
    if (statusF && r.status !== statusF) return false;
    if (q && !`${r.original_text} ${r.translated_text ?? ""} ${r.ai_summary ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Citizen reports</h1>
        <p className="mt-1 text-slateink dark:text-paper/70">
          {filtered.length} of {reports.length} reports · anonymised · spam can be flagged, never deleted silently
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Ward, category, minimum urgency, status, full-text search.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-sm">Ward
              <select name="ward" defaultValue={sp.ward ?? "all"} className="mt-1 h-10 w-full rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950">
                <option value="all">All wards</option>
                {wards.map((w) => <option key={w.id} value={w.id}>{w.ward_no ? `Ward ${w.ward_no} — ${w.ward_name}` : w.ward_name}</option>)}
              </select>
            </label>
            <label className="text-sm">Category
              <select name="category" defaultValue={sp.category ?? "all"} className="mt-1 h-10 w-full rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950">
                <option value="all">All categories</option>
                {CATEGORIES.map((c: Category) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm">Min urgency
              <select name="urgency" defaultValue={sp.urgency ?? "0"} className="mt-1 h-10 w-full rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950">
                <option value="0">Any</option>
                <option value="50">50+</option>
                <option value="70">70+</option>
                <option value="85">85+</option>
              </select>
            </label>
            <label className="text-sm">Status
              <select name="status" defaultValue={sp.status ?? "all"} className="mt-1 h-10 w-full rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950">
                <option value="all">All statuses</option>
                {REPORT_STATUSES.map((s: ReportStatus) => <option key={s} value={s}>{REPORT_STATUS_LABEL[s]}</option>)}
              </select>
            </label>
            <label className="text-sm lg:col-span-1">Search
              <input name="q" defaultValue={sp.q ?? ""} placeholder="water, school…" className="mt-1 h-10 w-full rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950" />
            </label>
            <div className="flex items-end">
              <button type="submit" className="h-10 w-full rounded-md bg-ink px-4 text-sm font-medium text-paper dark:bg-paper dark:text-ink">Apply</button>
            </div>
          </form>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No reports match these filters" hint="Try widening the urgency range or clearing the search." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-md">
                  <p className="text-sm leading-snug">“{r.original_text}”</p>
                  {r.translated_text && r.translated_text !== r.original_text && (
                    <p className="mt-1 text-xs text-slateink/80 dark:text-paper/60">EN: {r.translated_text}</p>
                  )}
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slateink dark:text-paper/60">
                    <span>{r.ward ? `${r.ward.ward_no ? `Ward ${r.ward.ward_no} · ` : ""}${r.ward.ward_name}` : "—"}</span>
                    <span>·</span><span>{formatDate(r.created_at)}</span>
                    {r.tracking_id && <span className="font-mono">· {r.tracking_id}</span>}
                    {r.ai_failed && <Badge variant="gold">AI fallback</Badge>}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="teal">{r.category}</Badge>
                  {r.ai_summary && <p className="mt-1 max-w-55 text-xs">{r.ai_summary}</p>}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">{r.urgency_score ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "flagged" ? "coral" : r.status === "new" ? "gold" : "slate"}>
                    {REPORT_STATUS_LABEL[r.status]}
                  </Badge>
                </TableCell>
                <TableCell><ReportRowActions id={r.id} status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
