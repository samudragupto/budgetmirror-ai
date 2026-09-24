import type { Metadata } from "next";
import { ReportForm } from "@/components/citizen/report-form";
import { getWards } from "@/lib/server-data";

export const metadata: Metadata = { title: "Report a need" };

export default async function ReportPage() {
  const { data: wards } = await getWards();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ReportForm wards={wards} />
    </div>
  );
}
