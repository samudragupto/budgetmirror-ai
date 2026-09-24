import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScorePill, ScoreBar } from "@/components/dashboard/score-pill";
import { Badge } from "@/components/ui/badge";
import { mismatchLabel } from "@/lib/scoring";
import { formatINR } from "@/lib/utils";
import type { WardCategoryMetric } from "@/types/metrics";

export function MismatchTable({ metrics, compact = false }: { metrics: WardCategoryMetric[]; compact?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ward · Category</TableHead>
          <TableHead className="text-right">Demand</TableHead>
          <TableHead className="text-right">Budget share</TableHead>
          <TableHead className="text-right">Alignment</TableHead>
          {!compact && <TableHead className="text-right">Priority</TableHead>}
          <TableHead>Mismatch type</TableHead>
          {!compact && <TableHead className="text-right">Allocated</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((m) => {
          const label = mismatchLabel(m.demand_score, m.budget_share === null ? null : Math.round(m.budget_share * 100));
          return (
            <TableRow key={m.id}>
              <TableCell>
                <Link href={`/admin/mismatch?ward=${m.ward_id}`} className="font-medium hover:text-signal hover:underline">
                  {m.ward_name}
                </Link>
                <span className="block text-xs text-slateink/80 dark:text-paper/60">{m.category} · {m.report_count} reports</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono font-bold">{m.demand_score}</span>
                <ScoreBar value={m.demand_score} tone="green" className="mt-1 w-20" />
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {m.budget_share === null ? "N/A" : `${Math.round(m.budget_share * 100)}%`}
              </TableCell>
              <TableCell className="text-right">
                <ScorePill score={m.alignment_score} />
              </TableCell>
              {!compact && (
                <TableCell className="text-right font-mono font-bold">{m.priority_score ?? "—"}</TableCell>
              )}
              <TableCell>
                <Badge variant={label === "Underfunded Critical Need" ? "coral" : label === "Potential Overspending / Review" ? "gold" : label === "Aligned Priority" ? "teal" : "slate"}>
                  {label}
                </Badge>
              </TableCell>
              {!compact && (
                <TableCell className="text-right font-mono">{formatINR(m.allocated_amount, { compact: true })}</TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
