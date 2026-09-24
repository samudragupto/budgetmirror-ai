"use client";

/**
 * Plain-language confirmation card with tracking ID + AI summary.
 * Payload arrives via sessionStorage (written by ReportForm on submit).
 */
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Payload {
  trackingId?: string;
  wardName?: string;
  analysis?: {
    translatedText: string;
    category: string;
    subCategory: string;
    summary: string;
    urgency: string;
    urgencyScore: number;
    department: string;
    confidence: number;
    aiFailed: boolean;
  };
}

function SuccessInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("bm-last-report");
      if (raw) setPayload(JSON.parse(raw) as Payload);
    } catch {
      /* ignore — show generic confirmation */
    }
    setLoaded(true);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!loaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-10">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const a = payload?.analysis;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-10 text-signal" aria-hidden="true" />
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Mirrored. Thank you.</h1>
          <p className="text-slateink dark:text-paper/70">Your need is now part of the public ledger.</p>
        </div>
      </div>

      <Card className="ledger-card mt-6">
        <CardHeader>
          <CardTitle>Confirmation card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-ink/12 bg-paper-100/60 p-3 dark:border-paper/15 dark:bg-paper/5">
            <span className="text-sm font-medium">Tracking ID</span>
            <code className="rounded bg-ink px-2 py-1 font-mono text-sm font-bold text-gold-light">{id || "—"}</code>
            <Button variant="ghost" size="sm" onClick={copy} className="ml-auto" aria-live="polite">
              <Copy className="size-4" aria-hidden="true" /> {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          {a ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold">What we understood</dt>
                <dd className="mt-0.5">{a.summary}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="teal">{a.category}</Badge>
                <Badge>{a.subCategory}</Badge>
                <Badge variant={a.urgencyScore >= 60 ? "coral" : "gold"}>
                  {a.urgency} urgency · {a.urgencyScore}/100
                </Badge>
              </div>
              <div>
                <dt className="font-semibold">Routed to</dt>
                <dd>{a.department}</dd>
              </div>
              {payload?.wardName && (
                <div>
                  <dt className="font-semibold">Ward</dt>
                  <dd>{payload.wardName}</dd>
                </div>
              )}
              <p className="text-xs text-slateink/80 dark:text-paper/60">
                {a.aiFailed
                  ? "AI classification was unavailable, so your words were stored as-is with a default urgency of 50. Nothing was lost."
                  : `AI confidence ${a.confidence}%. A human-readable record — scoring that affects budgets stays deterministic.`}
              </p>
            </dl>
          ) : (
            <p className="text-sm">
              Your report was received under ID <code className="font-mono font-bold">{id}</code>.
              {payload ? "" : " (Open this page right after submitting to see the AI summary.)"}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/transparency">See it on the public board <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/report">File another report</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportSuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10"><Skeleton className="h-40 w-full" /></div>}>
      <SuccessInner />
    </Suspense>
  );
}
