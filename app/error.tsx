"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-coral">Something misfiled</p>
      <h1 className="mt-2 font-serif text-4xl font-bold">This page hit a snag</h1>
      <p className="mt-3 text-slateink dark:text-paper/70">
        {error.message || "An unexpected error occurred. Your reports are safe — please try again."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
