import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export const GlassPanel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <section className={cn("glass-panel rounded-lg", className)} {...props} />
);
