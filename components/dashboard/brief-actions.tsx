"use client";

/**
 * AI policy-brief generator + Markdown download + print.
 * The brief text may be AI-drafted; the numbers inside stay deterministic.
 */
import { useState } from "react";
import { Download, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buildPolicyBrief } from "@/lib/policy-brief";
import type { Recommendation, WardCategoryMetric } from "@/types/metrics";

export function BriefActions({
  metrics,
  recommendations,
}: {
  metrics: WardCategoryMetric[];
  recommendations: Recommendation[];
}) {
  const [brief, setBrief] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function download() {
    const md = buildPolicyBrief({
      period: "2025-26",
      generatedAt: new Date().toLocaleString("en-IN"),
      metrics,
      recommendations,
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budgetmirror-policy-brief-2025-26.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generateAiBrief() {
    setBusy(true);
    try {
      const top = recommendations[0];
      const res = await fetch("/api/generate-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardId: top?.ward_id ?? "ward-5",
          category: top?.category ?? "Water Supply",
          mode: "brief",
        }),
      });
      const data = (await res.json()) as { ok: boolean; brief?: string };
      setBrief(data.ok && data.brief ? data.brief : null);
      if (!data.ok || !data.brief) {
        // Deterministic fallback brief.
        setBrief(buildPolicyBrief({
          period: "2025-26",
          generatedAt: new Date().toLocaleString("en-IN"),
          metrics: metrics.slice(0, 5),
          recommendations: recommendations.slice(0, 3),
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="no-print flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={download}>
          <Download aria-hidden="true" /> Download brief (.md)
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Print
        </Button>
        <Button size="sm" onClick={generateAiBrief} disabled={busy}>
          <Sparkles aria-hidden="true" /> {busy ? "Drafting…" : "AI policy brief"}
        </Button>
      </div>
      {brief && (
        <Alert variant="info" className="max-w-xl">
          <AlertDescription>
            <p className="mb-1 font-semibold">Draft brief (AI-assisted prose, deterministic numbers)</p>
            <p className="whitespace-pre-wrap font-serif text-base italic leading-relaxed">{brief}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
