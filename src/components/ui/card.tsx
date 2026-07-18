import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn("glass-panel rounded-lg", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn("space-y-1.5 p-5 pb-3", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>): JSX.Element => (
  <h3 className={cn("text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent", className)} {...props} />
);

export const CardDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>): JSX.Element => (
  <p className={cn("text-sm leading-6 text-reactor-muted", className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn("p-5 pt-2", className)} {...props} />
);
