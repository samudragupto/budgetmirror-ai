"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportStatus } from "@/lib/constants";

export function ReportRowActions({ id, status }: { id: string; status: ReportStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: ReportStatus) {
    setBusy(true);
    try {
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-1.5">
      {status === "new" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("acknowledged")} title="Acknowledge">
          <CheckCheck aria-hidden="true" /> Ack
        </Button>
      )}
      {status !== "flagged" ? (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("flagged")} title="Flag as spam/abuse">
          <Flag aria-hidden="true" /> Flag
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("new")} title="Unflag">
          Unflag
        </Button>
      )}
    </div>
  );
}
