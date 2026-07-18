import { useEffect, useMemo, useRef } from "react";

import {
  ReactorAnimationEngine,
  type ReactorFrameVariables,
} from "@/animations/ReactorAnimationEngine";
import { getReactorMode } from "@/services/reactorModes";
import { useReactorStore } from "@/store/useReactorStore";
import { cn } from "@/utils/cn";

interface ArcReactorCanvasProps {
  className?: string;
  variant?: "splash" | "dashboard" | "compact";
  showHud?: boolean;
}

export const ArcReactorCanvas = ({
  className,
  variant = "dashboard",
  showHud = true,
}: ArcReactorCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef(new ReactorAnimationEngine());
  const lastFrameRef = useRef(0);
  const frameCounterRef = useRef(0);
  const modeId = useReactorStore((state) => state.mode);
  const brightness = useReactorStore((state) => state.brightness);
  const color = useReactorStore((state) => state.color);
  const speed = useReactorStore((state) => state.speed);
  const power = useReactorStore((state) => state.power);
  const effects = useReactorStore((state) => state.effects);
  const settings = useReactorStore((state) => state.settings);
  const updateAnimation = useReactorStore((state) => state.updateAnimation);
  const mode = useMemo(() => getReactorMode(modeId), [modeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    if (!canvas || !parent) {
      return undefined;
    }

    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) {
      return undefined;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    const resize = (): void => {
      const rect = parent.getBoundingClientRect();
      dpr = settings.highPerformance ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();

    const render = (timestamp: number): void => {
      const previous = lastFrameRef.current || timestamp;
      const delta = timestamp - previous;
      lastFrameRef.current = timestamp;

      const variables: ReactorFrameVariables = engineRef.current.render(
        ctx,
        {
          width,
          height,
          time: timestamp / 1000,
          delta,
          dpr,
        },
        {
          mode,
          brightness,
          color,
          speed,
          power,
          effects,
          reducedMotion: settings.reducedMotion,
          highPerformance: settings.highPerformance,
          showHud,
          variant,
        },
      );

      frameCounterRef.current += 1;
      if (frameCounterRef.current % 12 === 0) {
        updateAnimation(variables);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [brightness, color, effects, mode, power, settings.highPerformance, settings.reducedMotion, showHud, speed, updateAnimation, variant]);

  return (
    <div className={cn("relative isolate min-h-72 w-full overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(9,11,16,0.18)_68%,rgba(9,11,16,0.72)_100%)]" />
    </div>
  );
};
