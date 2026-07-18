import { Download, Radio, RotateCcw, Send, TerminalSquare, Trash2 } from "lucide-react";

import { GlassPanel } from "@/components/telemetry/GlassPanel";
import { PageHeader } from "@/components/telemetry/PageHeader";
import { Button } from "@/components/ui/button";
import { useBleController } from "@/hooks/useBleController";
import { useReactorStore } from "@/store/useReactorStore";
import { formatNumber, formatTime } from "@/utils/format";

export const DeveloperConsole = (): JSX.Element => {
  const { scan, sendCommand, scanning } = useBleController();
  const packets = useReactorStore((state) => state.packets);
  const logs = useReactorStore((state) => state.logs);
  const clearLogs = useReactorStore((state) => state.clearLogs);
  const diagnostics = useReactorStore((state) => state.diagnostics);
  const animation = useReactorStore((state) => state.animation);
  const mode = useReactorStore((state) => state.mode);
  const brightness = useReactorStore((state) => state.brightness);

  const exportLogs = (): void => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), packets, logs, diagnostics, animation }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "arc-reactor-os-logs.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Developer"
        title="Console"
        description="Live BLE JSON messages, decoded commands, latency, FPS, mode state, logs, noise values, and animation variables."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                void scan();
              }}
              disabled={scanning}
            >
              <Radio />
              {scanning ? "Scanning" : "Scan"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void sendCommand("PING");
              }}
            >
              <Send />
              Ping
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Latency", `${formatNumber(diagnostics.latencyMs, 0)} ms`],
          ["FPS", formatNumber(diagnostics.fps, 0)],
          ["Current Mode", mode.toUpperCase()],
          ["Brightness", `${Math.round((brightness / 255) * 100)}%`],
        ].map(([label, value]) => (
          <GlassPanel key={label} className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-reactor-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-reactor-accent">{value}</p>
          </GlassPanel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <GlassPanel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TerminalSquare className="size-5 text-reactor-primary" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Live BLE Packets</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void sendCommand("STATUS");
              }}
            >
              <RotateCcw />
              Status
            </Button>
          </div>
          <div className="max-h-[560px] overflow-auto rounded-lg border border-reactor-secondary/10">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-reactor-card text-xs uppercase tracking-[0.16em] text-reactor-muted">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Dir</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Command</th>
                  <th className="px-4 py-3">JSON Payload</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((trace) => (
                  <tr key={trace.id} className="border-t border-reactor-secondary/10 text-reactor-muted">
                    <td className="px-4 py-3 text-reactor-accent">{formatTime(trace.timestamp)}</td>
                    <td className="px-4 py-3">{trace.direction.toUpperCase()}</td>
                    <td className="px-4 py-3">{trace.message.type}</td>
                    <td className="px-4 py-3">{trace.message.command ?? "-"}</td>
                    <td className="max-w-[520px] truncate px-4 py-3 font-mono text-xs text-reactor-primary">
                      {trace.raw}
                    </td>
                  </tr>
                ))}
                {packets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-reactor-muted">
                      BLE JSON stream idle.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Logs</p>
              <div className="flex gap-2">
                <Button variant="icon" size="icon" onClick={exportLogs} aria-label="Export logs">
                  <Download />
                </Button>
                <Button variant="icon" size="icon" onClick={clearLogs} aria-label="Clear logs">
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className="mt-4 max-h-72 space-y-2 overflow-auto">
              {logs.map((log) => (
                <div key={log.id} className="rounded-md border border-reactor-secondary/10 bg-black/[0.24] p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.14em] text-reactor-primary">{log.level}</span>
                    <span className="text-xs text-reactor-muted">{formatTime(log.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-reactor-muted">{log.message}</p>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-reactor-accent">Animation Variables</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Breathing", animation.breathingPhase],
                ["Noise", animation.plasmaNoise],
                ["Rotation", animation.magneticRotation],
                ["Particles", animation.particleCount],
                ["Arc", animation.arcIntensity],
                ["Field", diagnostics.fieldRotation],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-reactor-secondary/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-reactor-muted">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-reactor-accent">
                    {typeof value === "number" ? formatNumber(value, label === "Particles" ? 0 : 2) : value}
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </section>
    </div>
  );
};
