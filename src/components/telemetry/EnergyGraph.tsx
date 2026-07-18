import { useMemo } from "react";

import type { DiagnosticsSample } from "@/types/reactor";

interface EnergyGraphProps {
  samples: DiagnosticsSample[];
  metric: "powerOutput" | "plasmaStability" | "magneticContainment";
  label: string;
  color: string;
}

export const EnergyGraph = ({ samples, metric, label, color }: EnergyGraphProps): JSX.Element => {
  const path = useMemo(() => {
    if (samples.length === 0) {
      return "";
    }

    return samples
      .map((sample, index) => {
        const x = samples.length === 1 ? 0 : (index / (samples.length - 1)) * 100;
        const y = 52 - (Math.max(0, Math.min(100, sample[metric])) / 100) * 44;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [metric, samples]);

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-reactor-muted">{label}</p>
        <span className="size-2 rounded-full shadow-bloom" style={{ backgroundColor: color }} />
      </div>
      <svg viewBox="0 0 100 56" preserveAspectRatio="none" className="h-36 w-full overflow-visible">
        <defs>
          <linearGradient id={`graph-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.42" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 56 L 0 56 Z`} fill={`url(#graph-${metric})`} opacity="0.7" />
        <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    </div>
  );
};
