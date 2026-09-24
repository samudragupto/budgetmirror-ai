import { Inbox, TriangleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink/20 px-6 py-12 text-center dark:border-paper/20">
      <Inbox className="size-8 text-slateink/50 dark:text-paper/40" aria-hidden="true" />
      <p className="font-serif text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slateink/80 dark:text-paper/60">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title, hint, onRetry }: { title: string; hint?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-coral/30 bg-coral-50 px-6 py-12 text-center dark:bg-coral/10" role="alert">
      <TriangleAlert className="size-8 text-coral" aria-hidden="true" />
      <p className="font-serif text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm">{hint}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcw className="size-4" aria-hidden="true" /> Retry
        </Button>
      )}
    </div>
  );
}
