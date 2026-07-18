import { Bluetooth, Cpu, Gauge, History, Moon, RotateCcw, ShieldCheck, Zap } from "lucide-react";

import { GlassPanel } from "@/components/telemetry/GlassPanel";
import { PageHeader } from "@/components/telemetry/PageHeader";
import { Switch } from "@/components/ui/switch";
import { useReactorStore } from "@/store/useReactorStore";
import type { ReactorSettings } from "@/types/reactor";

const settingItems: Array<{
  key: keyof Omit<ReactorSettings, "theme">;
  label: string;
  detail: string;
  icon: typeof Bluetooth;
}> = [
  { key: "autoConnect", label: "Auto Connect", detail: "Attempt a reactor link when the OS shell opens.", icon: Bluetooth },
  { key: "reconnect", label: "Reconnect", detail: "Retry the active transport after a disconnect event.", icon: RotateCcw },
  { key: "reducedMotion", label: "Reduced Motion", detail: "Minimize cinematic animation timing and transitions.", icon: Gauge },
  { key: "highPerformance", label: "High Performance", detail: "Raise canvas density and particle count when the device can handle it.", icon: Zap },
  { key: "developerMode", label: "Developer Mode", detail: "Keep packet diagnostics and debug variables available.", icon: Cpu },
  { key: "rememberLastMode", label: "Remember Last Mode", detail: "Persist selected mode, color, speed, and effect state.", icon: History },
];

export const Settings = (): JSX.Element => {
  const settings = useReactorStore((state) => state.settings);
  const setSettings = useReactorStore((state) => state.setSettings);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Runtime behavior for connection policy, performance, motion, developer instrumentation, persistence, theme, and future modules."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {settingItems.map((item) => (
          <GlassPanel key={item.key} className="flex items-center justify-between gap-5 p-5">
            <div className="flex items-start gap-4">
              <div className="grid size-11 place-items-center rounded-md border border-reactor-primary/20 bg-reactor-primary/10 text-reactor-primary">
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-reactor-accent">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-reactor-muted">{item.detail}</p>
              </div>
            </div>
            <Switch
              checked={settings[item.key]}
              onCheckedChange={(checked) => setSettings({ [item.key]: checked })}
              aria-label={item.label}
            />
          </GlassPanel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3">
            <Moon className="size-5 text-reactor-primary" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Theme</p>
          </div>
          <div className="mt-5 rounded-lg border border-reactor-primary/25 bg-reactor-primary/10 p-4">
            <p className="text-lg font-semibold text-reactor-accent">Dark Mode Only</p>
            <p className="mt-2 text-sm leading-6 text-reactor-muted">
              Palette locked to #090B10, #11151D, #61E8FF, #8CF7FF, #DDFEFF, #FF4D5A, and #4AFFB4.
            </p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-reactor-success" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">About</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Application", "Arc Reactor OS"],
              ["Transport", "Web Bluetooth JSON"],
              ["Controller", "ESP32-C3"],
              ["Emitter", "WS2812B 16 LED Ring"],
              ["Input", "TTP223 Touch Sensor"],
              ["Expansion", "OTA, Audio, JARVIS, 3D Reactor, Cloud Sync"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-reactor-secondary/10 bg-black/[0.24] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-reactor-muted">{label}</p>
                <p className="mt-2 text-sm font-semibold text-reactor-accent">{value}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>
    </div>
  );
};
