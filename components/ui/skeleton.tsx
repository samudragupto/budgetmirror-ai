import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-ink/8 dark:bg-paper/10", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
