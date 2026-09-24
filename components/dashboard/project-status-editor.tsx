"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";

export function ProjectStatusEditor({ id, status }: { id: string; status: ProjectStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: ProjectStatus) {
    setBusy(true);
    try {
      await fetch(`/api/projects/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">Set status</span>
      <select
        value={status}
        disabled={busy}
        onChange={(e) => change(e.target.value as ProjectStatus)}
        className="h-9 rounded-md border border-ink/20 bg-white px-2 text-sm dark:border-paper/25 dark:bg-ink-950"
      >
        {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  );
}
