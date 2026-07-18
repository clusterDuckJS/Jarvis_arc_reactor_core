import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/utils/cn";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  progress?: number;
  tone?: "primary" | "success" | "danger" | "warning";
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  primary: "text-reactor-primary",
  success: "text-reactor-success",
  danger: "text-reactor-danger",
  warning: "text-reactor-warning",
};

export const MetricCard = ({
  icon: Icon,
  label,
  value,
  detail,
  progress,
  tone = "primary",
}: MetricCardProps): JSX.Element => (
  <motion.article
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 240, damping: 22 }}
    className="glass-panel rounded-lg p-4"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reactor-muted">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-reactor-accent">{value}</p>
      </div>
      <div className={cn("rounded-md border border-current/20 bg-current/10 p-2", toneClasses[tone])}>
        <Icon className="size-5" />
      </div>
    </div>
    {detail ? <p className="mt-3 text-sm text-reactor-muted">{detail}</p> : null}
    {typeof progress === "number" ? <Progress value={progress} className="mt-4" /> : null}
  </motion.article>
);
