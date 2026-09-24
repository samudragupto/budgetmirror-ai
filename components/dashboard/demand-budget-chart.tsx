"use client";

/**
 * THE hero visual: grouped bars of citizen demand vs budget share.
 * Client-only (loaded dynamically with ssr:false) + text fallback for AT.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartPalette } from "@/lib/design-tokens";
import type { DemandBudgetDatum } from "@/lib/chart-data";

export function DemandBudgetChart({ data }: { data: DemandBudgetDatum[] }) {
  return (
    <div>
      <div className="h-[320px] w-full" role="img" aria-label={`Grouped bar chart of demand versus budget share for ${data.length} categories`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 8 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} vertical={false} />
            <XAxis dataKey="short" tick={{ fontSize: 12, fill: chartPalette.axis }} interval={0} angle={-18} dy={10} height={52} />
            <YAxis tick={{ fontSize: 12, fill: chartPalette.axis }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #0B1F3322", fontSize: 13 }}
              formatter={(value, name) => [`${value}`, name === "demand" ? "Demand (0–100)" : "Budget share (%)"]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.category ?? label}
            />
            <Legend formatter={(v) => (v === "demand" ? "Demand score" : "Budget share %")} />
            <Bar dataKey="demand" fill={chartPalette.demand} radius={[4, 4, 0, 0]} maxBarSize={42} animationDuration={600} />
            <Bar dataKey="budgetShare" fill={chartPalette.budget} radius={[4, 4, 0, 0]} maxBarSize={42} animationDuration={600} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader / no-JS friendly summary */}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-medium text-signal">View chart data as text</summary>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {data.map((d) => (
            <li key={d.category}>
              {d.category}: demand {d.demand}, budget {d.budgetShare}%
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
