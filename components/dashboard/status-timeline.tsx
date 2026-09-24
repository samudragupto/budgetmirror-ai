import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Project lifecycle: Planned → Funded → In Progress → Delayed → Completed → … */
export function StatusTimeline({ status }: { status: ProjectStatus }) {
  const idx = PROJECT_STATUSES.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label={`Project status: ${status}`}>
      {PROJECT_STATUSES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <li key={s} className="flex items-center gap-1.5">
            <span
              aria-current={current ? "step" : undefined}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                current
                  ? "border-signal bg-signal text-white"
                  : done
                    ? "border-signal/40 bg-signal-50 text-signal-900 dark:bg-signal/15 dark:text-emerald-100"
                    : "border-ink/15 text-slateink/70 dark:border-paper/20 dark:text-paper/50",
              )}
            >
              {s}
            </span>
            {i < PROJECT_STATUSES.length - 1 && (
              <span className="text-ink/25 dark:text-paper/25" aria-hidden="true">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
