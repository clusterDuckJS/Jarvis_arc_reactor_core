import { create } from "zustand";
import { persist } from "zustand/middleware";

import { defaultEffects, type DecodedBleMessage } from "@/services/BLEProtocol";
import type { BleConnection, BleTransport, ReactorStatus } from "@/types/bluetooth";
import type {
  AnimationVariables,
  DiagnosticsSample,
  EffectKey,
  EffectsState,
  PacketDirection,
  ReactorDiagnostics,
  ReactorLog,
  ReactorModeId,
  ReactorSettings,
  RgbColor,
} from "@/types/reactor";

export interface PacketTrace {
  id: string;
  timestamp: number;
  direction: PacketDirection;
  message: DecodedBleMessage;
  raw: string;
  latencyMs?: number;
}

interface ReactorState {
  connected: boolean;
  connectionName: string;
  transport: BleTransport;
  power: boolean;
  brightness: number;
  mode: ReactorModeId;
  speed: number;
  color: RgbColor;
  effects: EffectsState;
  battery: number;
  diagnostics: ReactorDiagnostics;
  diagnosticsHistory: DiagnosticsSample[];
  settings: ReactorSettings;
  packets: PacketTrace[];
  logs: ReactorLog[];
  animation: AnimationVariables;
  setConnection: (connection: BleConnection | null) => void;
  setPower: (power: boolean) => void;
  setBrightness: (brightness: number) => void;
  setMode: (mode: ReactorModeId) => void;
  setSpeed: (speed: number) => void;
  setColor: (color: RgbColor) => void;
  setEffect: (effect: EffectKey, enabled: boolean) => void;
  setSettings: (settings: Partial<ReactorSettings>) => void;
  updateDiagnostics: (diagnostics: Partial<ReactorDiagnostics>) => void;
  applyStatus: (status: ReactorStatus) => void;
  addPacket: (trace: Omit<PacketTrace, "id">) => void;
  addLog: (log: Omit<ReactorLog, "id">) => void;
  clearLogs: () => void;
  updateAnimation: (variables: Partial<AnimationVariables>) => void;
}

const initialDiagnostics: ReactorDiagnostics = {
  batteryPercent: 84,
  voltage: 3.86,
  estimatedRuntimeMinutes: 124,
  powerDrawWatts: 1.42,
  signalDbm: -48,
  signalStrength: 82,
  firmwareVersion: "awaiting-link",
  hardwareVersion: "ESP32-C3 / WS2812B-16 / TTP223",
  temperatureC: 34.2,
  powerOutput: 72,
  plasmaStability: 94,
  magneticContainment: 91,
  latencyMs: 0,
  fps: 60,
  noiseValue: 0.28,
  fieldRotation: 0,
};

const initialSettings: ReactorSettings = {
  autoConnect: false,
  reconnect: true,
  reducedMotion: false,
  highPerformance: true,
  developerMode: true,
  rememberLastMode: true,
  theme: "dark",
};

const initialAnimation: AnimationVariables = {
  breathingPhase: 0,
  plasmaNoise: 0,
  magneticRotation: 0,
  particleCount: 96,
  arcIntensity: 0.42,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.round(value)));

const id = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const appendHistory = (
  history: DiagnosticsSample[],
  diagnostics: ReactorDiagnostics,
): DiagnosticsSample[] => {
  const next = [
    ...history,
    {
      timestamp: Date.now(),
      powerOutput: diagnostics.powerOutput,
      plasmaStability: diagnostics.plasmaStability,
      magneticContainment: diagnostics.magneticContainment,
    },
  ];

  return next.slice(-72);
};

const wakeEffects = (effects: EffectsState): EffectsState => ({
  ...effects,
  deepSleep: false,
});

export const useReactorStore = create<ReactorState>()(
  persist(
    (set) => ({
      connected: false,
      connectionName: "Offline",
      transport: "offline",
      power: true,
      brightness: 192,
      mode: "mark-iii",
      speed: 144,
      color: { r: 97, g: 232, b: 255 },
      effects: defaultEffects,
      battery: initialDiagnostics.batteryPercent,
      diagnostics: initialDiagnostics,
      diagnosticsHistory: appendHistory([], initialDiagnostics),
      settings: initialSettings,
      packets: [],
      logs: [
        {
          id: id("log"),
          timestamp: Date.now(),
          level: "info",
          message: "Arc Reactor OS initialized.",
        },
      ],
      animation: initialAnimation,
      setConnection: (connection) =>
        set(() => ({
          connected: Boolean(connection),
          connectionName: connection?.name ?? "Offline",
          transport: connection?.transport ?? "offline",
        })),
      setPower: (power) =>
        set((state) => ({
          power,
          effects: power ? wakeEffects(state.effects) : state.effects,
        })),
      setBrightness: (brightness) => set(() => ({ brightness: clamp(brightness, 0, 255) })),
      setMode: (mode) => set(() => ({ mode })),
      setSpeed: (speed) => set(() => ({ speed: clamp(speed, 0, 255) })),
      setColor: (color) =>
        set(() => ({
          color: {
            r: clamp(color.r, 0, 255),
            g: clamp(color.g, 0, 255),
            b: clamp(color.b, 0, 255),
          },
        })),
      setEffect: (effect, enabled) =>
        set((state) => ({
          effects: {
            ...state.effects,
            [effect]: enabled,
          },
        })),
      setSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
            theme: "dark",
          },
        })),
      updateDiagnostics: (diagnostics) =>
        set((state) => {
          const nextDiagnostics = {
            ...state.diagnostics,
            ...diagnostics,
          };

          return {
            diagnostics: nextDiagnostics,
            battery: nextDiagnostics.batteryPercent,
            diagnosticsHistory: appendHistory(state.diagnosticsHistory, nextDiagnostics),
          };
        }),
      applyStatus: (status) =>
        set((state) => ({
          connected: status.connected,
          power: status.power,
          brightness: status.brightness,
          mode: status.mode,
          speed: status.speed,
          color: status.color,
          effects: status.effects,
          diagnostics: status.diagnostics,
          battery: status.diagnostics.batteryPercent,
          diagnosticsHistory: appendHistory(state.diagnosticsHistory, status.diagnostics),
        })),
      addPacket: (trace) =>
        set((state) => ({
          packets: [{ ...trace, id: id("packet") }, ...state.packets].slice(0, 120),
        })),
      addLog: (log) =>
        set((state) => ({
          logs: [{ ...log, id: id("log") }, ...state.logs].slice(0, 180),
        })),
      clearLogs: () => set(() => ({ logs: [] })),
      updateAnimation: (variables) =>
        set((state) => ({
          animation: {
            ...state.animation,
            ...variables,
          },
        })),
    }),
    {
      name: "arc-reactor-os",
      partialize: (state) => ({
        brightness: state.brightness,
        mode: state.settings.rememberLastMode ? state.mode : "mark-iii",
        speed: state.speed,
        color: state.color,
        effects: wakeEffects(state.effects),
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ReactorState> | undefined;

        return {
          ...current,
          ...persistedState,
          effects: wakeEffects({
            ...current.effects,
            ...persistedState?.effects,
          }),
        };
      },
    },
  ),
);
