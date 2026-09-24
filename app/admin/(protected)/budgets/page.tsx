import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecalcButton } from "@/components/dashboard/recalc-button";
import { getBudgets, getWards } from "@/lib/server-data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Budget allocations" };

export default async function BudgetsPage() {
  const [{ data: budgets }, { data: wards }] = await Promise.all([getBudgets(), getWards()]);
  const wardName = (id: string | null) => {
    const w = wards.find((x) => x.id === id);
    return w ? `${w.ward_no ? `Ward ${w.ward_no} · ` : ""}${w.ward_name}` : "—";
  };
  const total = budgets.reduce((s, b) => s + b.allocated_amount, 0);
  const spent = budgets.reduce((s, b) => s + b.spent_amount, 0);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Budget allocations</h1>
          <p className="mt-1 text-slateink dark:text-paper/70">
            {formatINR(total)} allocated · {formatINR(spent)} spent ({total ? Math.round((spent / total) * 100) : 0}% utilisation)
          </p>
        </div>
        <div className="flex gap-2">
          <RecalcButton />
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/budget-upload">Upload CSV/PDF</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allocation ledger</CardTitle>
          <CardDescription>Every row links wards, categories, and funding sources.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>FY</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{wardName(b.ward_id)}</TableCell>
                  <TableCell>
                    <Badge variant="teal">{b.category}</Badge>
                    {b.sub_category && <span className="block text-xs text-slateink/80 dark:text-paper/60">{b.sub_category}</span>}
                  </TableCell>
                  <TableCell className="font-mono">{b.financial_year}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatINR(b.allocated_amount)}</TableCell>
                  <TableCell className="text-right font-mono">{formatINR(b.spent_amount)}</TableCell>
                  <TableCell className="text-sm">{b.funding_source ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
