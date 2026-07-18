import { Activity, Atom, Gauge, Sparkles, Zap } from "lucide-react";

import { ModeCard } from "@/components/controls/ModeCard";
import { ArcReactorCanvas } from "@/components/reactor/ArcReactorCanvas";
import { GlassPanel } from "@/components/telemetry/GlassPanel";
import { PageHeader } from "@/components/telemetry/PageHeader";
import { REACTOR_MODES, getReactorMode } from "@/services/reactorModes";
import { useBleController } from "@/hooks/useBleController";
import { useReactorStore } from "@/store/useReactorStore";
import type { ReactorModeDefinition } from "@/types/reactor";
import { rgbToCss } from "@/utils/color";
import { formatNumber } from "@/utils/format";

export const Modes = (): JSX.Element => {
  const modeId = useReactorStore((state) => state.mode);
  const setMode = useReactorStore((state) => state.setMode);
  const setColor = useReactorStore((state) => state.setColor);
  const { sendCommand } = useBleController();
  const activeMode = getReactorMode(modeId);

  const selectMode = (mode: ReactorModeDefinition): void => {
    setMode(mode.id);
    setColor(mode.primaryColor);
    void sendCommand("SET_MODE");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reactor Profiles"
        title="Mode Matrix"
        description="Each profile carries color, glow, noise, rotation, surge, breathing, and particle parameters for the procedural reactor and firmware packet."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {REACTOR_MODES.map((mode) => (
            <ModeCard key={mode.id} mode={mode} selected={mode.id === modeId} onSelect={selectMode} />
          ))}
        </div>

        <GlassPanel className="sticky top-24 h-fit p-5">
          <div
            className="rounded-lg border border-reactor-secondary/10"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${rgbToCss(activeMode.primaryColor, 0.24)}, transparent 68%)`,
            }}
          >
            <ArcReactorCanvas variant="compact" showHud className="h-80 min-h-0" />
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-reactor-primary">{activeMode.shortName}</p>
            <h2 className="mt-2 text-3xl font-semibold text-reactor-accent">{activeMode.name}</h2>
            <p className="mt-3 text-sm leading-6 text-reactor-muted">{activeMode.description}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { icon: Sparkles, label: "Glow", value: activeMode.glow },
              { icon: Activity, label: "Noise", value: activeMode.noise },
              { icon: Atom, label: "Rotation", value: activeMode.rotationSpeed },
              { icon: Zap, label: "Surge", value: activeMode.surgeFrequency },
              { icon: Gauge, label: "Breathing", value: activeMode.breathingSpeed },
              { icon: Sparkles, label: "Particles", value: activeMode.particleDensity },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-reactor-secondary/10 bg-white/[0.03] p-3">
                <item.icon className="mb-3 size-4 text-reactor-primary" />
                <p className="text-xs text-reactor-muted">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-reactor-accent">{formatNumber(item.value * 100, 0)}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>
    </div>
  );
};
