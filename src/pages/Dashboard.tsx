import { Activity, BatteryCharging, Bluetooth, Radio, Shield, Thermometer, Zap } from "lucide-react";

import { ArcReactorCanvas } from "@/components/reactor/ArcReactorCanvas";
import { MetricCard } from "@/components/telemetry/MetricCard";
import { PageHeader } from "@/components/telemetry/PageHeader";
import { Button } from "@/components/ui/button";
import { useBleController } from "@/hooks/useBleController";
import { useReactorStore } from "@/store/useReactorStore";
import { formatNumber, formatPercent, formatRuntime } from "@/utils/format";

export const Dashboard = (): JSX.Element => {
  const { connect, disconnect, connected, connecting } = useBleController();
  const state = useReactorStore();
  const diagnostics = state.diagnostics;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reactor Command"
        title="Arc Reactor OS"
        description="A cinematic operating surface for ESP32-C3 reactor hardware, BLE telemetry, plasma states, and magnetic containment."
        action={
          <Button
            variant={connected ? "danger" : "primary"}
            onClick={() => {
              void (connected ? disconnect() : connect());
            }}
            disabled={connecting}
          >
            <Bluetooth />
            {connected ? "Disconnect" : connecting ? "Linking" : "Connect Reactor"}
          </Button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
        <div className="glass-panel scanline min-h-[520px] rounded-lg">
          <ArcReactorCanvas className="h-[520px]" variant="dashboard" showHud />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            icon={Bluetooth}
            label="Connection"
            value={state.connected ? state.connectionName : "Offline"}
            detail={state.transport}
            progress={state.connected ? 100 : 8}
            tone={state.connected ? "success" : "warning"}
          />
          <MetricCard
            icon={BatteryCharging}
            label="Battery"
            value={formatPercent(state.battery)}
            detail={`${formatNumber(diagnostics.voltage, 2)} V / ${formatRuntime(diagnostics.estimatedRuntimeMinutes)}`}
            progress={state.battery}
            tone={state.battery > 24 ? "success" : "danger"}
          />
          <MetricCard
            icon={Zap}
            label="Power Output"
            value={`${formatNumber(diagnostics.powerOutput, 0)}%`}
            detail={`${formatNumber(diagnostics.powerDrawWatts, 2)} W draw`}
            progress={diagnostics.powerOutput}
          />
          <MetricCard
            icon={Activity}
            label="Plasma Stability"
            value={formatPercent(diagnostics.plasmaStability)}
            detail={`Noise ${formatNumber(diagnostics.noiseValue * 100, 0)}`}
            progress={diagnostics.plasmaStability}
            tone="success"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Shield}
          label="Magnetic Containment"
          value={formatPercent(diagnostics.magneticContainment)}
          detail="Field integrity"
          progress={diagnostics.magneticContainment}
        />
        <MetricCard
          icon={Radio}
          label="Signal Strength"
          value={formatPercent(diagnostics.signalStrength)}
          detail={`${formatNumber(diagnostics.signalDbm, 0)} dBm`}
          progress={diagnostics.signalStrength}
        />
        <MetricCard
          icon={Thermometer}
          label="Temperature"
          value={`${formatNumber(diagnostics.temperatureC, 1)} C`}
          detail="Thermal telemetry placeholder"
          progress={Math.min(100, diagnostics.temperatureC * 1.8)}
          tone={diagnostics.temperatureC < 48 ? "primary" : "danger"}
        />
      </section>
    </div>
  );
};
