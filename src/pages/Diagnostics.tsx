import { BatteryCharging, Cpu, HardDrive, Radio, Timer, Zap } from "lucide-react";

import { EnergyGraph } from "@/components/telemetry/EnergyGraph";
import { Gauge } from "@/components/telemetry/Gauge";
import { GlassPanel } from "@/components/telemetry/GlassPanel";
import { MetricCard } from "@/components/telemetry/MetricCard";
import { PageHeader } from "@/components/telemetry/PageHeader";
import { useReactorStore } from "@/store/useReactorStore";
import { formatNumber, formatPercent, formatRuntime } from "@/utils/format";

const toVoltageProgress = (voltage: number): number => ((voltage - 3.2) / (4.2 - 3.2)) * 100;

export const Diagnostics = (): JSX.Element => {
  const diagnostics = useReactorStore((state) => state.diagnostics);
  const history = useReactorStore((state) => state.diagnosticsHistory);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Telemetry"
        title="Diagnostics"
        description="Live battery, voltage, runtime, draw, signal, firmware, containment, and output analytics from the reactor transport."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Gauge
          label="Battery"
          value={diagnostics.batteryPercent}
          displayValue={Math.round(diagnostics.batteryPercent).toString()}
          detail={formatRuntime(diagnostics.estimatedRuntimeMinutes)}
          tone={diagnostics.batteryPercent > 24 ? "success" : "danger"}
        />
        <Gauge
          label="Voltage"
          value={toVoltageProgress(diagnostics.voltage)}
          displayValue={formatNumber(diagnostics.voltage, 2)}
          unit="V"
          detail="LiPo cell"
        />
        <Gauge
          label="Runtime"
          value={Math.min(100, (diagnostics.estimatedRuntimeMinutes / 180) * 100)}
          displayValue={formatRuntime(diagnostics.estimatedRuntimeMinutes)}
          unit=""
          detail="Estimated"
        />
        <Gauge
          label="Power Draw"
          value={Math.min(100, (diagnostics.powerDrawWatts / 2.4) * 100)}
          displayValue={formatNumber(diagnostics.powerDrawWatts, 2)}
          unit="W"
          detail="Current profile"
          tone="warning"
        />
        <Gauge
          label="Signal"
          value={diagnostics.signalStrength}
          displayValue={Math.round(diagnostics.signalStrength).toString()}
          detail={`${formatNumber(diagnostics.signalDbm, 0)} dBm`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <EnergyGraph samples={history} metric="powerOutput" label="Power Output Graph" color="#61E8FF" />
        <EnergyGraph samples={history} metric="plasmaStability" label="Plasma Stability Graph" color="#4AFFB4" />
        <EnergyGraph samples={history} metric="magneticContainment" label="Containment Graph" color="#DDFEFF" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Cpu}
          label="Firmware"
          value={diagnostics.firmwareVersion}
          detail="BLE status characteristic"
        />
        <MetricCard icon={HardDrive} label="Hardware Version" value="C3 Reactor" detail={diagnostics.hardwareVersion} />
        <MetricCard
          icon={BatteryCharging}
          label="Battery"
          value={formatPercent(diagnostics.batteryPercent)}
          detail={`${formatNumber(diagnostics.voltage, 2)} V`}
          progress={diagnostics.batteryPercent}
        />
        <MetricCard
          icon={Zap}
          label="Output"
          value={formatPercent(diagnostics.powerOutput)}
          detail={`${formatNumber(diagnostics.powerDrawWatts, 2)} W`}
          progress={diagnostics.powerOutput}
        />
        <MetricCard
          icon={Radio}
          label="Signal"
          value={`${formatNumber(diagnostics.signalDbm, 0)} dBm`}
          detail={formatPercent(diagnostics.signalStrength)}
          progress={diagnostics.signalStrength}
        />
        <MetricCard
          icon={Timer}
          label="Latency"
          value={`${formatNumber(diagnostics.latencyMs, 0)} ms`}
          detail={`${formatNumber(diagnostics.fps, 0)} FPS`}
          progress={Math.max(0, 100 - diagnostics.latencyMs)}
        />
      </section>

      <GlassPanel className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Hardware Envelope</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["Controller", "ESP32-C3"],
            ["Emitter", "WS2812B 16 LED Ring"],
            ["Wake Surface", "TTP223 Touch Sensor"],
            ["Power", "LiPo Battery"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-reactor-secondary/10 bg-black/[0.24] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-reactor-muted">{label}</p>
              <p className="mt-2 text-sm font-semibold text-reactor-accent">{value}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};
