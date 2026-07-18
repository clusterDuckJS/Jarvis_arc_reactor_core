import { Gauge, Palette, Rabbit, Waves } from "lucide-react";

import { ColorWheel } from "@/components/controls/ColorWheel";
import { EffectToggle } from "@/components/controls/EffectToggle";
import { ModeCard } from "@/components/controls/ModeCard";
import { PowerButton } from "@/components/controls/PowerButton";
import { RadialSlider } from "@/components/controls/RadialSlider";
import { PageHeader } from "@/components/telemetry/PageHeader";
import { GlassPanel } from "@/components/telemetry/GlassPanel";
import { Slider } from "@/components/ui/slider";
import { REACTOR_MODES } from "@/services/reactorModes";
import { useBleController } from "@/hooks/useBleController";
import { useReactorStore } from "@/store/useReactorStore";
import type { EffectKey, ReactorModeDefinition } from "@/types/reactor";

const effects: Array<{ id: EffectKey; label: string; detail: string }> = [
  { id: "breathing", label: "Breathing", detail: "Slow luminosity envelope for core respiration." },
  { id: "livingPlasma", label: "Living Plasma", detail: "Organic turbulence through the active color field." },
  { id: "rotatingPlasma", label: "Rotating Plasma", detail: "Orbital motion around the magnetic containment ring." },
  { id: "energySurge", label: "Energy Surge", detail: "Short bursts for high-output cinematic pulses." },
  { id: "electricalFlicker", label: "Electrical Flicker", detail: "White-blue arc noise across the reactor surface." },
  { id: "colorShift", label: "Color Shift", detail: "App-side phase shift for future firmware profiles." },
  { id: "heartbeat", label: "Heartbeat", detail: "Paired pulse cadence for standby character." },
  { id: "deepSleep", label: "Deep Sleep", detail: "Sets the firmware sleep flag on next packet." },
  { id: "autoWake", label: "Auto Wake", detail: "Allows TTP223 wake behavior after sleep." },
];

export const Controls = (): JSX.Element => {
  const store = useReactorStore();
  const { sendCommand } = useBleController();

  const selectMode = (mode: ReactorModeDefinition): void => {
    store.setMode(mode.id);
    store.setColor(mode.primaryColor);
    void sendCommand("SET_MODE");
  };

  const togglePower = (): void => {
    const next = !store.power;
    store.setPower(next);
    void sendCommand(next ? "POWER_ON" : "POWER_OFF");
  };

  const setEffect = (effect: EffectKey, enabled: boolean): void => {
    store.setEffect(effect, enabled);
    void sendCommand(effect === "deepSleep" && enabled ? "SLEEP" : "SET_EFFECTS");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Containment Controls"
        title="Core Operations"
        description="Direct reactor commands for power, luminosity, speed, mode profile, plasma behavior, and HSV color synthesis."
      />

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <GlassPanel className="flex flex-col items-center justify-center gap-6 p-6">
          <PowerButton powered={store.power} onToggle={togglePower} />
          <div className="grid w-full grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-reactor-secondary/10 bg-black/[0.24] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-reactor-muted">Mode</p>
              <p className="mt-1 text-lg font-semibold text-reactor-accent">{store.mode.toUpperCase()}</p>
            </div>
            <div className="rounded-lg border border-reactor-secondary/10 bg-black/[0.24] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-reactor-muted">Power</p>
              <p className="mt-1 text-lg font-semibold text-reactor-accent">{store.power ? "ON" : "OFF"}</p>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <RadialSlider
            label="Brightness"
            value={store.brightness}
            onChange={(next) => {
              store.setBrightness(next);
              void sendCommand("SET_BRIGHTNESS");
            }}
          />
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <Rabbit className="size-5 text-reactor-primary" />
              <div>
                <p className="text-sm font-semibold text-reactor-accent">Animation Speed</p>
                <p className="text-xs text-reactor-muted">Packet Byte3 / field velocity</p>
              </div>
            </div>
            <Slider
              className="mt-8"
              min={0}
              max={255}
              step={1}
              value={[store.speed]}
              onValueChange={([next]) => {
                store.setSpeed(next ?? store.speed);
                void sendCommand("SET_SPEED");
              }}
            />
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-reactor-secondary/10 bg-white/[0.03] p-3">
                <Gauge className="mb-2 size-4 text-reactor-primary" />
                <p className="text-xs text-reactor-muted">Brightness</p>
                <p className="text-lg font-semibold text-reactor-accent">{Math.round((store.brightness / 255) * 100)}%</p>
              </div>
              <div className="rounded-lg border border-reactor-secondary/10 bg-white/[0.03] p-3">
                <Waves className="mb-2 size-4 text-reactor-primary" />
                <p className="text-xs text-reactor-muted">Speed</p>
                <p className="text-lg font-semibold text-reactor-accent">{store.speed}</p>
              </div>
              <div className="rounded-lg border border-reactor-secondary/10 bg-white/[0.03] p-3">
                <Palette className="mb-2 size-4 text-reactor-primary" />
                <p className="text-xs text-reactor-muted">RGB</p>
                <p className="text-lg font-semibold text-reactor-accent">{store.color.r}/{store.color.g}/{store.color.b}</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REACTOR_MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode} selected={store.mode === mode.id} onSelect={selectMode} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <GlassPanel className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Effects</p>
          <div className="mt-5 grid gap-3">
            {effects.map((effect) => (
              <EffectToggle
                key={effect.id}
                id={effect.id}
                label={effect.label}
                detail={effect.detail}
                enabled={store.effects[effect.id]}
                onChange={setEffect}
              />
            ))}
          </div>
        </GlassPanel>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Color Lab</p>
          <ColorWheel
            color={store.color}
            onChange={(color) => {
              store.setColor(color);
              void sendCommand("SET_COLOR");
            }}
          />
        </div>
      </section>
    </div>
  );
};
