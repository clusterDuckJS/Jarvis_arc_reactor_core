import { useCallback, useRef, useState } from "react";

interface RadialSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export const RadialSlider = ({
  label,
  value,
  min = 0,
  max = 255,
  onChange,
}: RadialSliderProps): JSX.Element => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const percent = (value - min) / (max - min);
  const angle = percent * 270 - 135;
  const circumference = 2 * Math.PI * 42;
  const dash = circumference * 0.75;
  const offset = dash - dash * percent;

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number): void => {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      const rawAngle = (((Math.atan2(y, x) * 180) / Math.PI + 90) + 360) % 360;
      const clamped =
        rawAngle > 135 && rawAngle < 225
          ? rawAngle < 180
            ? 270
            : 0
          : rawAngle >= 225
            ? rawAngle - 225
            : rawAngle + 135;

      onChange(Math.round(min + (clamped / 270) * (max - min)));
    },
    [max, min, onChange],
  );

  return (
    <div className="glass-panel flex flex-col items-center rounded-lg p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-reactor-muted">{label}</p>
      <svg
        ref={svgRef}
        viewBox="0 0 120 120"
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        tabIndex={0}
        onPointerDown={(event) => {
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (dragging) {
            updateFromPointer(event.clientX, event.clientY);
          }
        }}
        onPointerUp={() => setDragging(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            onChange(Math.min(max, value + 4));
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            onChange(Math.max(min, value - 4));
          }
        }}
        className="mt-4 size-56 touch-none overflow-visible outline-none"
      >
        <circle cx="60" cy="60" r="42" fill="rgba(255,255,255,0.03)" stroke="rgba(221,254,255,0.08)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#61E8FF"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
          transform="rotate(135 60 60)"
          className="drop-shadow-[0_0_16px_rgba(97,232,255,0.65)] transition-all"
        />
        <g transform={`rotate(${angle} 60 60)`}>
          <circle cx="60" cy="18" r="5" fill="#DDFEFF" className="drop-shadow-[0_0_10px_rgba(221,254,255,0.8)]" />
        </g>
        <text x="60" y="56" textAnchor="middle" className="fill-reactor-accent text-2xl font-semibold">
          {Math.round((value / max) * 100)}
        </text>
        <text x="60" y="74" textAnchor="middle" className="fill-reactor-muted text-[9px] font-semibold uppercase">
          percent
        </text>
      </svg>
    </div>
  );
};
