import type {
  EffectsState,
  ReactorDiagnostics,
  ReactorModeId,
  RgbColor,
} from "@/types/reactor";

export const ARC_REACTOR_SERVICE_UUID = "b7e90001-78fb-4f2c-9b8f-a1c000000001";
export const ARC_REACTOR_COMMAND_CHARACTERISTIC_UUID = "b7e90002-78fb-4f2c-9b8f-a1c000000002";
export const ARC_REACTOR_STATUS_CHARACTERISTIC_UUID = "b7e90003-78fb-4f2c-9b8f-a1c000000003";

export const COMMANDS = {
  POWER_ON: "POWER_ON",
  POWER_OFF: "POWER_OFF",
  SET_MODE: "SET_MODE",
  SET_BRIGHTNESS: "SET_BRIGHTNESS",
  SET_COLOR: "SET_COLOR",
  SET_SPEED: "SET_SPEED",
  SET_EFFECTS: "SET_EFFECTS",
  PING: "PING",
  STATUS: "STATUS",
  SLEEP: "SLEEP",
  WAKE: "WAKE",
} as const;

export type CommandName = keyof typeof COMMANDS;

export const defaultEffects: EffectsState = {
  breathing: true,
  livingPlasma: true,
  rotatingPlasma: true,
  energySurge: false,
  electricalFlicker: true,
  colorShift: false,
  heartbeat: false,
  deepSleep: false,
  autoWake: true,
};

export interface ReactorCommandState {
  power: boolean;
  brightness: number;
  mode: ReactorModeId;
  speed: number;
  color: RgbColor;
  effects: EffectsState;
}

export interface CommandMessage {
  type: "command";
  command: CommandName;
  state: ReactorCommandState;
  sentAt: number;
  requestId: string;
}

export interface StatusMessage {
  type: "status";
  uptimeMs?: number;
  state?: Partial<ReactorCommandState>;
  diagnostics?: Partial<ReactorDiagnostics>;
  firmwareVersion?: string;
  hardwareVersion?: string;
  ack?: string;
  requestId?: string;
}

export interface LogMessage {
  type: "log" | "error" | "pong";
  level?: "info" | "success" | "warning" | "error";
  message?: string;
  requestId?: string;
}

export type BleJsonMessage = CommandMessage | StatusMessage | LogMessage;
export type PacketInput = CommandMessage;

export interface DecodedBleMessage {
  type: string;
  command?: CommandName;
  requestId?: string;
  payload: BleJsonMessage | Record<string, unknown>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCommandName = (value: unknown): value is CommandName =>
  typeof value === "string" && value in COMMANDS;

const isKnownMessageType = (value: string): value is BleJsonMessage["type"] =>
  value === "command" || value === "status" || value === "log" || value === "error" || value === "pong";

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readMode = (value: unknown, fallback: ReactorModeId): ReactorModeId => {
  if (
    value === "mark-i" ||
    value === "mark-ii" ||
    value === "mark-iii" ||
    value === "avengers" ||
    value === "nano" ||
    value === "experimental"
  ) {
    return value;
  }

  return fallback;
};

const readColor = (value: unknown, fallback: RgbColor): RgbColor => {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    r: clampByte(readNumber(value.r, fallback.r)),
    g: clampByte(readNumber(value.g, fallback.g)),
    b: clampByte(readNumber(value.b, fallback.b)),
  };
};

const readEffects = (value: unknown, fallback: EffectsState): EffectsState => {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    breathing: readBoolean(value.breathing, fallback.breathing),
    livingPlasma: readBoolean(value.livingPlasma, fallback.livingPlasma),
    rotatingPlasma: readBoolean(value.rotatingPlasma, fallback.rotatingPlasma),
    energySurge: readBoolean(value.energySurge, fallback.energySurge),
    electricalFlicker: readBoolean(value.electricalFlicker, fallback.electricalFlicker),
    colorShift: readBoolean(value.colorShift, fallback.colorShift),
    heartbeat: readBoolean(value.heartbeat, fallback.heartbeat),
    deepSleep: readBoolean(value.deepSleep, fallback.deepSleep),
    autoWake: readBoolean(value.autoWake, fallback.autoWake),
  };
};

export const createPacketInput = (
  command: CommandName,
  snapshot: ReactorCommandState,
): CommandMessage => ({
  type: "command",
  command,
  state: {
    power: snapshot.power,
    brightness: clampByte(snapshot.brightness),
    mode: snapshot.mode,
    speed: clampByte(snapshot.speed),
    color: {
      r: clampByte(snapshot.color.r),
      g: clampByte(snapshot.color.g),
      b: clampByte(snapshot.color.b),
    },
    effects: snapshot.effects,
  },
  sentAt: Date.now(),
  requestId: createRequestId(),
});

export const encodeJsonMessage = (message: BleJsonMessage): Uint8Array =>
  encoder.encode(JSON.stringify(message));

export const decodeJsonMessage = (value: DataView | ArrayBuffer | Uint8Array | string): BleJsonMessage => {
  const raw =
    typeof value === "string"
      ? value
      : value instanceof Uint8Array
        ? decoder.decode(value)
        : value instanceof DataView
          ? decoder.decode(value)
          : decoder.decode(new Uint8Array(value));
  const parsed: unknown = JSON.parse(raw);

  if (!isRecord(parsed) || typeof parsed.type !== "string") {
    throw new Error("BLE JSON message is missing a type field.");
  }

  if (parsed.type === "command") {
    if (!isCommandName(parsed.command)) {
      throw new Error("BLE command message has an unknown command.");
    }

    const state = isRecord(parsed.state) ? parsed.state : {};
    const fallback: ReactorCommandState = {
      power: true,
      brightness: 192,
      mode: "mark-iii",
      speed: 144,
      color: { r: 97, g: 232, b: 255 },
      effects: defaultEffects,
    };

    return {
      type: "command",
      command: parsed.command,
      requestId: typeof parsed.requestId === "string" ? parsed.requestId : "",
      sentAt: readNumber(parsed.sentAt, Date.now()),
      state: {
        power: readBoolean(state.power, fallback.power),
        brightness: clampByte(readNumber(state.brightness, fallback.brightness)),
        mode: readMode(state.mode, fallback.mode),
        speed: clampByte(readNumber(state.speed, fallback.speed)),
        color: readColor(state.color, fallback.color),
        effects: readEffects(state.effects, fallback.effects),
      },
    };
  }

  if (!isKnownMessageType(parsed.type)) {
    throw new Error(`Unknown BLE JSON message type: ${parsed.type}.`);
  }

  return parsed as unknown as BleJsonMessage;
};

export const describeJsonMessage = (message: BleJsonMessage): DecodedBleMessage => {
  const requestId =
    "requestId" in message && typeof message.requestId === "string"
      ? message.requestId
      : undefined;

  return {
    type: message.type,
    ...(message.type === "command" ? { command: message.command } : {}),
    ...(requestId ? { requestId } : {}),
    payload: message,
  };
};

export const normalizeStatusMessage = (
  message: BleJsonMessage,
  fallback: ReactorCommandState,
  diagnostics: ReactorDiagnostics,
) => {
  if (message.type !== "status") {
    return null;
  }

  const state = isRecord(message.state) ? message.state : {};
  const nextState: ReactorCommandState = {
    power: readBoolean(state.power, fallback.power),
    brightness: clampByte(readNumber(state.brightness, fallback.brightness)),
    mode: readMode(state.mode, fallback.mode),
    speed: clampByte(readNumber(state.speed, fallback.speed)),
    color: readColor(state.color, fallback.color),
    effects: readEffects(state.effects, fallback.effects),
  };

  const rawDiagnostics = isRecord(message.diagnostics) ? message.diagnostics : {};
  const nextDiagnostics: ReactorDiagnostics = {
    ...diagnostics,
    batteryPercent: readNumber(rawDiagnostics.batteryPercent, diagnostics.batteryPercent),
    voltage: readNumber(rawDiagnostics.voltage, diagnostics.voltage),
    estimatedRuntimeMinutes: readNumber(
      rawDiagnostics.estimatedRuntimeMinutes,
      diagnostics.estimatedRuntimeMinutes,
    ),
    powerDrawWatts: readNumber(rawDiagnostics.powerDrawWatts, diagnostics.powerDrawWatts),
    signalDbm: readNumber(rawDiagnostics.signalDbm, diagnostics.signalDbm),
    signalStrength: readNumber(rawDiagnostics.signalStrength, diagnostics.signalStrength),
    firmwareVersion:
      typeof message.firmwareVersion === "string"
        ? message.firmwareVersion
        : typeof rawDiagnostics.firmwareVersion === "string"
          ? rawDiagnostics.firmwareVersion
          : diagnostics.firmwareVersion,
    hardwareVersion:
      typeof message.hardwareVersion === "string"
        ? message.hardwareVersion
        : typeof rawDiagnostics.hardwareVersion === "string"
          ? rawDiagnostics.hardwareVersion
          : diagnostics.hardwareVersion,
    temperatureC: readNumber(rawDiagnostics.temperatureC, diagnostics.temperatureC),
    powerOutput: readNumber(rawDiagnostics.powerOutput, diagnostics.powerOutput),
    plasmaStability: readNumber(rawDiagnostics.plasmaStability, diagnostics.plasmaStability),
    magneticContainment: readNumber(
      rawDiagnostics.magneticContainment,
      diagnostics.magneticContainment,
    ),
    latencyMs: readNumber(rawDiagnostics.latencyMs, diagnostics.latencyMs),
    fps: readNumber(rawDiagnostics.fps, diagnostics.fps),
    noiseValue: readNumber(rawDiagnostics.noiseValue, diagnostics.noiseValue),
    fieldRotation: readNumber(rawDiagnostics.fieldRotation, diagnostics.fieldRotation),
  };

  return {
    connected: true,
    ...nextState,
    diagnostics: nextDiagnostics,
  };
};
