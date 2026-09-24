"use client";

/**
 * Citizen validation: rating 1–5 + issue_resolved + feedback.
 * Anonymous-friendly — no login required.
 */
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function ValidationForm({ projectId, demoMode }: { projectId: string; demoMode: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [resolved, setResolved] = useState<"yes" | "partial" | "no">("partial");
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setState("sending");
    try {
      const res = await fetch(`/api/projects/${projectId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, issueResolved: resolved, feedback: feedback.trim() || undefined }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <Alert variant="info">
        <AlertTitle>Validation recorded — thank you</AlertTitle>
        <AlertDescription>
          {demoMode
            ? "Demo mode: your validation was accepted in-memory. Connect Supabase to persist validations."
            : "Your rating now feeds this project's public impact score."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Your rating</Label>
        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="rounded p-1"
            >
              <Star
                className={cn("size-7 transition-colors", (hover || rating) >= n ? "fill-gold text-gold" : "text-ink/25 dark:text-paper/25")}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Did this project resolve your issue?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["yes", "partial", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setResolved(v)}
              aria-pressed={resolved === v}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium",
                resolved === v ? "border-signal bg-signal text-white" : "border-ink/20 dark:border-paper/25",
              )}
            >
              {v === "yes" ? "Yes, resolved" : v === "partial" ? "Partially" : "No"}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="vfeedback">Feedback <span className="font-normal">(optional)</span></Label>
        <Textarea
          id="vfeedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
          placeholder="What changed on the ground?"
          className="mt-2 min-h-[90px]"
        />
      </div>

      {state === "error" && (
        <Alert variant="error"><AlertDescription>Couldn&apos;t save — please try again.</AlertDescription></Alert>
      )}

      <Button type="submit" disabled={rating === 0 || state === "sending"}>
        {state === "sending" ? "Saving…" : "Submit validation"}
      </Button>
    </form>
  );
}
