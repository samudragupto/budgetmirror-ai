import type { Metadata } from "next";
import Link from "next/link";
import { BudgetUploader } from "@/components/dashboard/budget-uploader";
import { getWards } from "@/lib/server-data";

export const metadata: Metadata = { title: "Budget upload" };

export default async function BudgetUploadPage() {
  const { data: wards, demoMode } = await getWards();
  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Budget upload</h1>
        <p className="mt-1 max-w-2xl text-slateink dark:text-paper/70">
          CSV is primary; PDF extraction is AI-assisted. <strong>Nothing is auto-trusted:</strong> every
          row lands in a review grid and only enters the ledger when you approve it.{" "}
          <Link href="/sample-budget.csv" className="font-medium text-signal hover:underline" download>
            Download the sample CSV template
          </Link>.
        </p>
      </div>
      <BudgetUploader
        wards={wards.map((w) => ({ id: w.id, ward_name: w.ward_name, ward_no: w.ward_no }))}
        demoMode={demoMode}
      />
    </div>
  );
}
