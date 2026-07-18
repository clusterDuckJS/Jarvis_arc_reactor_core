export const REACTOR_MODE_IDS = [
  "mark-i",
  "mark-ii",
  "mark-iii",
  "avengers",
  "nano",
  "experimental",
] as const;

export type ReactorModeId = (typeof REACTOR_MODE_IDS)[number];

export type EffectKey =
  | "breathing"
  | "livingPlasma"
  | "rotatingPlasma"
  | "energySurge"
  | "electricalFlicker"
  | "colorShift"
  | "heartbeat"
  | "deepSleep"
  | "autoWake";

export type EffectsState = Record<EffectKey, boolean>;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export interface ReactorModeDefinition {
  id: ReactorModeId;
  name: string;
  shortName: string;
  primaryColor: RgbColor;
  secondaryColor: RgbColor;
  glow: number;
  noise: number;
  rotationSpeed: number;
  surgeFrequency: number;
  breathingSpeed: number;
  particleDensity: number;
  bloom: number;
  description: string;
}

export interface ReactorDiagnostics {
  batteryPercent: number;
  voltage: number;
  estimatedRuntimeMinutes: number;
  powerDrawWatts: number;
  signalDbm: number;
  signalStrength: number;
  firmwareVersion: string;
  hardwareVersion: string;
  temperatureC: number;
  powerOutput: number;
  plasmaStability: number;
  magneticContainment: number;
  latencyMs: number;
  fps: number;
  noiseValue: number;
  fieldRotation: number;
}

export interface DiagnosticsSample {
  timestamp: number;
  powerOutput: number;
  plasmaStability: number;
  magneticContainment: number;
}

export interface ReactorSettings {
  autoConnect: boolean;
  reconnect: boolean;
  reducedMotion: boolean;
  highPerformance: boolean;
  developerMode: boolean;
  rememberLastMode: boolean;
  theme: "dark";
}

export type PacketDirection = "tx" | "rx";

export interface ReactorLog {
  id: string;
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface AnimationVariables {
  breathingPhase: number;
  plasmaNoise: number;
  magneticRotation: number;
  particleCount: number;
  arcIntensity: number;
}
