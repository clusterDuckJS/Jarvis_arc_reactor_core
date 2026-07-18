import { useCallback, useEffect, useMemo, useRef } from "react";

import { Slider } from "@/components/ui/slider";
import type { HsvColor, RgbColor } from "@/types/reactor";
import { hsvToRgb, rgbToCss, rgbToHex, rgbToHsv } from "@/utils/color";

interface ColorPreset {
  name: string;
  color: RgbColor;
}

const presets: ColorPreset[] = [
  { name: "Movie Blue", color: { r: 97, g: 232, b: 255 } },
  { name: "Ice Blue", color: { r: 140, g: 247, b: 255 } },
  { name: "White Plasma", color: { r: 255, g: 255, b: 255 } },
  { name: "Warm White", color: { r: 255, g: 223, b: 184 } },
  { name: "Purple", color: { r: 148, g: 105, b: 255 } },
  { name: "Green", color: { r: 74, g: 255, b: 180 } },
  { name: "Gold", color: { r: 255, g: 209, b: 102 } },
  { name: "Red", color: { r: 255, g: 77, b: 90 } },
];

interface ColorWheelProps {
  color: RgbColor;
  onChange: (color: RgbColor) => void;
}

export const ColorWheel = ({ color, onChange }: ColorWheelProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hsv = useMemo(() => rgbToHsv(color), [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    const size = 260;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const image = ctx.createImageData(size, size);
    const radius = size / 2 - 4;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x - size / 2;
        const dy = y - size / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const index = (y * size + x) * 4;

        if (distance <= radius) {
          const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
          const saturation = distance / radius;
          const rgb = hsvToRgb({ h: hue, s: saturation, v: 1 });
          image.data[index] = rgb.r;
          image.data[index + 1] = rgb.g;
          image.data[index + 2] = rgb.b;
          image.data[index + 3] = Math.round(255 * Math.min(1, saturation + 0.22));
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  }, []);

  const selectFromPointer = useCallback(
    (clientX: number, clientY: number): void => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      const radius = rect.width / 2 - 4;
      const distance = Math.min(radius, Math.sqrt(x * x + y * y));
      const next: HsvColor = {
        h: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360,
        s: distance / radius,
        v: hsv.v,
      };
      onChange(hsvToRgb(next));
    },
    [hsv.v, onChange],
  );

  const markerRadius = 126 * hsv.s;
  const markerAngle = (hsv.h * Math.PI) / 180;
  const markerX = 130 + Math.cos(markerAngle) * markerRadius;
  const markerY = 130 + Math.sin(markerAngle) * markerRadius;

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="relative mx-auto size-[260px] shrink-0">
          <canvas
            ref={canvasRef}
            className="size-[260px] rounded-full shadow-bloom"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              selectFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) {
                selectFromPointer(event.clientX, event.clientY);
              }
            }}
          />
          <span
            className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-bloom"
            style={{
              left: markerX,
              top: markerY,
              background: rgbToCss(color),
            }}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="rounded-lg border border-reactor-secondary/[0.15] bg-black/30 p-4">
            <div
              className="h-24 rounded-md border border-white/[0.15] shadow-bloom"
              style={{ background: `linear-gradient(135deg, ${rgbToCss(color)}, rgba(255,255,255,0.18))` }}
            />
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-reactor-muted">
              <span>H {Math.round(hsv.h)}</span>
              <span>S {Math.round(hsv.s * 100)}</span>
              <span>V {Math.round(hsv.v * 100)}</span>
              <span>{rgbToHex(color)}</span>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-reactor-muted">Value</p>
            <Slider
              min={0.08}
              max={1}
              step={0.01}
              value={[hsv.v]}
              onValueChange={([nextValue]) => {
                onChange(hsvToRgb({ ...hsv, v: nextValue ?? hsv.v }));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.color)}
                className="flex items-center gap-2 rounded-md border border-reactor-secondary/[0.12] bg-white/[0.03] px-3 py-2 text-left text-xs font-semibold text-reactor-accent transition hover:border-reactor-secondary/40 hover:bg-white/[0.06]"
              >
                <span className="size-3 rounded-full shadow-bloom" style={{ background: rgbToCss(preset.color) }} />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
