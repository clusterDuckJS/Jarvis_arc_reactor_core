import { cn } from "@/utils/cn";

interface GaugeProps {
  label: string;
  value: number;
  displayValue?: string;
  unit?: string;
  detail?: string;
  tone?: "primary" | "success" | "danger" | "warning";
}

const toneStroke: Record<NonNullable<GaugeProps["tone"]>, string> = {
  primary: "#61E8FF",
  success: "#4AFFB4",
  danger: "#FF4D5A",
  warning: "#FFD166",
};

export const Gauge = ({
  label,
  value,
  displayValue,
  unit = "%",
  detail,
  tone = "primary",
}: GaugeProps): JSX.Element => {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="glass-panel flex min-h-56 flex-col items-center justify-center rounded-lg p-5 text-center">
      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="size-full rotate-[-90deg]">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(221,254,255,0.08)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={toneStroke[tone]}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="8"
            className="drop-shadow-[0_0_14px_rgba(97,232,255,0.42)] transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-semibold text-reactor-accent", tone === "danger" && "text-reactor-danger")}>
            {displayValue ?? Math.round(value)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-reactor-muted">{unit}</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-reactor-accent">{label}</p>
      {detail ? <p className="mt-2 text-sm text-reactor-muted">{detail}</p> : null}
    </div>
  );
};
