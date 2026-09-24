"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecalcButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/recalculate-metrics", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; updated?: number; demoMode?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "failed");
      setMsg(data.demoMode ? `Demo mode: recomputed in memory.` : `Recalculated ${data.updated ?? 0} metric rows.`);
      router.refresh();
    } catch {
      setMsg("Recalculation failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="ink" size="sm" onClick={run} disabled={busy} aria-live="polite">
        <RefreshCw aria-hidden="true" className={busy ? "animate-spin" : ""} />
        {busy ? "Recalculating…" : "Recalculate metrics"}
      </Button>
      {msg && <span className="text-xs text-slateink dark:text-paper/60">{msg}</span>}
    </span>
  );
}
