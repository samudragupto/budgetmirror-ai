import { ALIGNMENT_BANDS } from "@/lib/constants";
import { scoreTones, toneForAlignment } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ScorePill({
  score,
  label,
  className,
}: {
  score: number | null;
  label?: string;
  className?: string;
}) {
  if (score === null) {
    return (
      <span className={cn("inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-600", className)}>
        N/A
      </span>
    );
  }
  const tone = toneForAlignment(score);
  const band = ALIGNMENT_BANDS.find((b) => score >= b.min);
  const t = scoreTones[tone];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold", className)}
      style={{ backgroundColor: t.bg, color: t.fg, borderColor: t.ring }}
      title={label ?? `Alignment ${score} — ${band?.label ?? ""}`}
      aria-label={label ?? `Score ${score} out of 100, ${band?.label ?? ""}`}
    >
      {score}
      {band && <span className="font-sans font-medium">{band.label}</span>}
    </span>
  );
}

/** Thin animated score bar (animates once on view via CSS). */
export function ScoreBar({ value, tone, className }: { value: number; tone?: keyof typeof scoreTones; className?: string }) {
  const t = scoreTones[tone ?? toneForAlignment(value)];
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-ink/8 dark:bg-paper/10", className)}
      role="img"
      aria-label={`Score bar: ${value} out of 100`}
    >
      <div
        className="scorebar-fill h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: t.ring }}
      />
    </div>
  );
}
