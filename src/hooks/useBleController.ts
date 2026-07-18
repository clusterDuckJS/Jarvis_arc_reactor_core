import { useCallback, useEffect, useMemo, useState } from "react";

import { createPacketInput, type CommandName } from "@/services/BLEProtocol";
import { bleService } from "@/services/bleClient";
import { useReactorStore } from "@/store/useReactorStore";
import type { BleEvent, BleScanResult } from "@/types/bluetooth";

let unsubscribeBleEvents: (() => void) | null = null;

const handleBleEvent = (event: BleEvent): void => {
  const store = useReactorStore.getState();

  if (event.type === "connected") {
    store.setConnection(event.connection);
    store.addLog({
      timestamp: event.timestamp,
      level: "success",
      message: `${event.connection.name} linked over ${event.connection.transport}.`,
    });
    return;
  }

  if (event.type === "disconnected") {
    store.setConnection(null);
    store.addLog({
      timestamp: event.timestamp,
      level: "warning",
      message: event.reason ?? "Arc Reactor link closed.",
    });
    return;
  }

  if (event.type === "packet") {
    store.addPacket({
      timestamp: event.timestamp,
      direction: event.direction,
      message: event.message,
      raw: event.raw,
      ...(typeof event.latencyMs === "number" ? { latencyMs: event.latencyMs } : {}),
    });

    if (typeof event.latencyMs === "number") {
      store.updateDiagnostics({ latencyMs: event.latencyMs });
    }
    return;
  }

  if (event.type === "status") {
    store.applyStatus(event.status);
    return;
  }

  if (event.type === "json") {
    return;
  }

  store.addLog({
    timestamp: event.timestamp,
    level: event.level,
    message: event.message,
  });
};

const ensureBleSubscription = (): void => {
  if (!unsubscribeBleEvents) {
    unsubscribeBleEvents = bleService.subscribe(handleBleEvent);
  }
};

export const useBleController = () => {
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const connected = useReactorStore((state) => state.connected);
  const settings = useReactorStore((state) => state.settings);

  useEffect(() => {
    ensureBleSubscription();
  }, []);

  useEffect(() => {
    bleService.autoReconnect(settings.reconnect);
  }, [settings.reconnect]);

  const connect = useCallback(async (): Promise<void> => {
    ensureBleSubscription();
    setConnecting(true);

    try {
      await bleService.connect();
    } catch (error) {
      useReactorStore.getState().addLog({
        timestamp: Date.now(),
        level: "error",
        message: `Connection failed: ${String(error instanceof Error ? error.message : error)}`,
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await bleService.disconnect();
    } catch (error) {
      useReactorStore.getState().addLog({
        timestamp: Date.now(),
        level: "error",
        message: `Disconnect failed: ${String(error instanceof Error ? error.message : error)}`,
      });
    }
  }, []);

  const scan = useCallback(async (): Promise<BleScanResult[]> => {
    setScanning(true);

    try {
      const devices = await bleService.scan();
      useReactorStore.getState().addLog({
        timestamp: Date.now(),
        level: devices.length > 0 ? "info" : "warning",
        message: devices.length > 0 ? `${devices.length} reactor target detected.` : "No reactor targets detected.",
      });
      return devices;
    } catch (error) {
      useReactorStore.getState().addLog({
        timestamp: Date.now(),
        level: "error",
        message: `Scan failed: ${String(error instanceof Error ? error.message : error)}`,
      });
      return [];
    } finally {
      setScanning(false);
    }
  }, []);

  const sendCommand = useCallback(async (command: CommandName): Promise<void> => {
    const state = useReactorStore.getState();
    const packet = createPacketInput(command, {
      power: state.power,
      brightness: state.brightness,
      mode: state.mode,
      speed: state.speed,
      color: state.color,
      effects: state.effects,
    });

    try {
      await bleService.sendPacket(packet);
    } catch (error) {
      state.addLog({
        timestamp: Date.now(),
        level: "error",
        message: `Packet ${command} failed: ${String(error instanceof Error ? error.message : error)}`,
      });
    }
  }, []);

  return useMemo(
    () => ({
      connected,
      connecting,
      scanning,
      connect,
      disconnect,
      scan,
      sendCommand,
    }),
    [connect, connected, connecting, disconnect, scan, scanning, sendCommand],
  );
};
