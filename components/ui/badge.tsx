import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-ink/15 bg-ink/5 text-ink dark:border-paper/20 dark:bg-paper/10 dark:text-paper",
        teal: "border-signal/30 bg-signal-50 text-signal-900 dark:bg-signal/15 dark:text-emerald-100",
        coral: "border-coral/30 bg-coral-50 text-coral-700 dark:bg-coral/15 dark:text-orange-100",
        gold: "border-gold/40 bg-[#F8EDD3] text-[#7A5B12] dark:bg-gold/15 dark:text-gold-light",
        slate: "border-slate-300 bg-slate-100 text-slate-700 dark:border-paper/20 dark:bg-paper/10 dark:text-paper",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
