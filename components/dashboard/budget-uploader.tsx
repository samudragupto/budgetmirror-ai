"use client";

/**
 * CSV-first budget upload with PDF assist.
 * Flow: choose file → server parses/extracts → review grid (editable) →
 * approve → allocations written → metrics recalculated.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, MAX_CSV_BYTES, MAX_PDF_BYTES } from "@/lib/constants";

interface ReviewRow {
  ward_name: string;
  financial_year: string;
  category: string;
  sub_category: string;
  allocated_amount: number;
  spent_amount: number;
  project_name: string;
  project_status: string;
  _line: number;
  _wardId: string | null;
  _categoryValid: boolean;
}

export function BudgetUploader({
  wards,
  demoMode,
}: {
  wards: Array<{ id: string; ward_name: string; ward_no: number | null }>;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fy, setFy] = useState("2025-26");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  const wardName = useMemo(() => {
    const map = new Map(wards.map((w) => [w.id, w.ward_name]));
    return (id: string | null) => (id ? (map.get(id) ?? "Unknown") : "— unmatched —");
  }, [wards]);

  async function parse() {
    if (!file) return;
    setBusy(true);
    setErrors([]);
    setRows([]);
    setNotice(null);
    setApproved(false);
    try {
      const limit = file.name.toLowerCase().endsWith(".pdf") ? MAX_PDF_BYTES : MAX_CSV_BYTES;
      if (file.size > limit) throw new Error(`File too large (max ${Math.round(limit / 1024 / 1024)} MB).`);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("financialYear", fy);
      const res = await fetch("/api/upload-budget", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok: boolean;
        rows?: ReviewRow[];
        errors?: Array<{ line: number; message: string }>;
        aiFailed?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Parse failed.");
      setRows(data.rows ?? []);
      setErrors(data.errors ?? []);
      if (data.aiFailed) setNotice("AI extraction was unavailable — no rows were guessed. Upload a CSV instead, or retry.");
      else if ((data.rows ?? []).length > 0) setNotice(`${data.rows!.length} row(s) ready for your review. Nothing is saved until you approve.`);
    } catch (e) {
      setErrors([{ line: 0, message: e instanceof Error ? e.message : "Parse failed." }]);
    } finally {
      setBusy(false);
    }
  }

  function edit(idx: number, patch: Partial<ReviewRow>) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function approve() {
    setBusy(true);
    try {
      const res = await fetch("/api/upload-budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, fileName: file?.name ?? "manual", sourceType: file?.name.toLowerCase().endsWith(".pdf") ? "pdf" : "csv", financialYear: fy }),
      });
      const data = (await res.json()) as { ok: boolean; inserted?: number; error?: string; demoMode?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Approval failed.");
      setApproved(true);
      setNotice(
        data.demoMode
          ? `Approved ${data.inserted ?? rows.length} row(s) in demo mode (in-memory). Connect Supabase to persist. Metrics recalculation simulated.`
          : `Approved — ${data.inserted ?? rows.length} allocation(s) written and metrics recalculated.`,
      );
      router.refresh();
    } catch (e) {
      setErrors([{ line: 0, message: e instanceof Error ? e.message : "Approval failed." }]);
    } finally {
      setBusy(false);
    }
  }

  const unmatched = rows.filter((r) => !r._wardId).length;
  const badCat = rows.filter((r) => !r._categoryValid).length;

  return (
    <div className="space-y-6">
      <Card className="ledger-card">
        <CardHeader>
          <CardTitle>1 · Choose a file</CardTitle>
          <CardDescription>CSV columns: ward_name, financial_year, category, sub_category, allocated_amount, spent_amount, project_name, project_status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Financial year
            <select value={fy} onChange={(e) => setFy(e.target.value)} className="ml-2 h-10 rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950">
              <option>2024-25</option>
              <option>2025-26</option>
              <option>2026-27</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-ink/25 px-4 py-2.5 text-sm font-medium hover:border-signal dark:border-paper/25">
            {file?.name.toLowerCase().endsWith(".pdf") ? <FileText className="size-4" aria-hidden="true" /> : <FileSpreadsheet className="size-4" aria-hidden="true" />}
            {file ? file.name : "Select CSV or PDF…"}
            <input type="file" accept=".csv,.pdf,text/csv,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button onClick={parse} disabled={!file || busy}>
            <Upload aria-hidden="true" /> {busy ? "Parsing…" : "Parse for review"}
          </Button>
          {demoMode && <Badge variant="gold">Demo mode — approvals stay in memory</Badge>}
        </CardContent>
      </Card>

      {notice && (
        <Alert variant={approved ? "info" : "warn"}>
          <AlertTitle>{approved ? "Approved" : "Review required"}</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="error">
          <AlertTitle>{errors.length} problem{errors.length === 1 ? "" : "s"} found</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.slice(0, 10).map((e, i) => <li key={i}>Line {e.line}: {e.message}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>2 · Review &amp; approve</CardTitle>
                <CardDescription>
                  Fix wards/categories inline. {unmatched} unmatched ward{unmatched === 1 ? "" : "s"} · {badCat} off-list categor{badCat === 1 ? "y" : "ies"}.
                </CardDescription>
              </div>
              <Button onClick={approve} disabled={busy || unmatched > 0} variant="gold">
                <CheckCircle2 aria-hidden="true" /> {busy ? "Writing…" : `Approve ${rows.length} rows`}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>CSV ward</TableHead>
                  <TableHead>Matched ward</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Allocated ₹</TableHead>
                  <TableHead className="text-right">Spent ₹</TableHead>
                  <TableHead>Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r._line}>
                    <TableCell className="font-mono">{r._line}</TableCell>
                    <TableCell>{r.ward_name}</TableCell>
                    <TableCell>
                      <select
                        value={r._wardId ?? ""}
                        onChange={(e) => edit(i, { _wardId: e.target.value || null })}
                        className="h-9 rounded border border-ink/20 bg-white px-1 text-xs dark:border-paper/25 dark:bg-ink-950"
                        aria-label={`Matched ward for row ${r._line}`}
                      >
                        <option value="">— unmatched —</option>
                        {wards.map((w) => <option key={w.id} value={w.id}>{w.ward_no ? `W${w.ward_no} ` : ""}{w.ward_name}</option>)}
                      </select>
                      {!r._wardId && <Badge variant="coral" className="ml-1">fix</Badge>}
                      {r._wardId && <span className="sr-only">{wardName(r._wardId)}</span>}
                    </TableCell>
                    <TableCell>
                      <select
                        value={r.category}
                        onChange={(e) => edit(i, { category: e.target.value, _categoryValid: true })}
                        className="h-9 max-w-44 rounded border border-ink/20 bg-white px-1 text-xs dark:border-paper/25 dark:bg-ink-950"
                        aria-label={`Category for row ${r._line}`}
                      >
                        {!r._categoryValid && <option value={r.category}>{r.category} (off-list)</option>}
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <input type="number" min={0} value={r.allocated_amount} onChange={(e) => edit(i, { allocated_amount: Number(e.target.value) })} className="h-9 w-28 rounded border border-ink/20 bg-white px-1 text-right font-mono text-xs dark:border-paper/25 dark:bg-ink-950" aria-label={`Allocated amount row ${r._line}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      <input type="number" min={0} value={r.spent_amount} onChange={(e) => edit(i, { spent_amount: Number(e.target.value) })} className="h-9 w-24 rounded border border-ink/20 bg-white px-1 text-right font-mono text-xs dark:border-paper/25 dark:bg-ink-950" aria-label={`Spent amount row ${r._line}`} />
                    </TableCell>
                    <TableCell className="max-w-52 text-xs">{r.project_name || "—"}<span className="block text-slateink/70 dark:text-paper/50">{r.project_status}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {unmatched > 0 && <p className="mt-2 text-sm text-coral-700 dark:text-orange-300">Match every ward before approving — unmatched rows are never written.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
