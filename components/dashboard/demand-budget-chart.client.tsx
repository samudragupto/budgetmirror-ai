"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { DemandBudgetDatum } from "@/lib/chart-data";

const Chart = dynamic(
  () => import("@/components/dashboard/demand-budget-chart").then((m) => m.DemandBudgetChart),
  { ssr: false, loading: () => <Skeleton className="h-[320px] w-full" /> },
);

/** Client boundary so server pages can embed the chart without SSR. */
export function DemandBudgetChartClient({ data }: { data: DemandBudgetDatum[] }) {
  return <Chart data={data} />;
}
