import { useEffect } from "react";

import { useReactorStore } from "@/store/useReactorStore";

export const useReactorRuntime = (): void => {
  const connected = useReactorStore((state) => state.connected);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (time: number): void => {
      const delta = Math.max(1, time - last);
      last = time;
      frame += 1;

      if (frame % 16 === 0) {
        const state = useReactorStore.getState();
        const elapsed = time / 1000;
        const speedFactor = 0.22 + state.speed / 255;

        state.updateAnimation({
          breathingPhase: (Math.sin(elapsed * speedFactor) + 1) / 2,
          plasmaNoise: (Math.sin(elapsed * 1.7) + Math.cos(elapsed * 0.9)) / 4 + 0.5,
          magneticRotation: (elapsed * speedFactor) % (Math.PI * 2),
          particleCount: Math.round(42 + state.brightness * 0.42),
          arcIntensity: state.effects.electricalFlicker ? (Math.sin(elapsed * 5.8) + 1) / 2 : 0.12,
        });

        if (!connected) {
          const diagnostics = state.diagnostics;
          state.updateDiagnostics({
            fps: Math.round(1000 / delta),
            powerOutput: Math.max(10, diagnostics.powerOutput + Math.sin(elapsed) * 0.6),
            plasmaStability: Math.min(100, Math.max(70, diagnostics.plasmaStability + Math.cos(elapsed * 0.7) * 0.4)),
            magneticContainment: Math.min(
              100,
              Math.max(70, diagnostics.magneticContainment + Math.sin(elapsed * 0.5) * 0.35),
            ),
          });
        }
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(raf);
  }, [connected]);
};
