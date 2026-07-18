import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
  {
    variants: {
      variant: {
        default: "border-reactor-secondary/25 bg-reactor-secondary/[0.08] text-reactor-secondary",
        success: "border-reactor-success/30 bg-reactor-success/10 text-reactor-success",
        danger: "border-reactor-danger/[0.35] bg-reactor-danger/10 text-reactor-danger",
        muted: "border-white/10 bg-white/5 text-reactor-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps): JSX.Element => (
  <span className={cn(badgeVariants({ variant, className }))} {...props} />
);
