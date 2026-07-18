import type { EffectsState, ReactorDiagnostics, ReactorModeId, RgbColor } from "@/types/reactor";
import type {
  BleJsonMessage,
  CommandName,
  DecodedBleMessage,
  PacketInput,
} from "@/services/BLEProtocol";

export type BleTransport = "web-bluetooth" | "offline";

export interface BleConnection {
  id: string;
  name: string;
  transport: BleTransport;
}

export interface BleScanResult {
  id: string;
  name: string;
  rssi?: number;
  transport: BleTransport;
}

export interface ReactorStatus {
  connected: boolean;
  power: boolean;
  brightness: number;
  mode: ReactorModeId;
  speed: number;
  color: RgbColor;
  effects: EffectsState;
  diagnostics: ReactorDiagnostics;
}

export type BleEvent =
  | {
      type: "connected";
      timestamp: number;
      connection: BleConnection;
    }
  | {
      type: "disconnected";
      timestamp: number;
      reason?: string;
    }
  | {
      type: "packet";
      timestamp: number;
      direction: "tx" | "rx";
      message: DecodedBleMessage;
      raw: string;
      latencyMs?: number;
    }
  | {
      type: "status";
      timestamp: number;
      status: ReactorStatus;
    }
  | {
      type: "json";
      timestamp: number;
      direction: "tx" | "rx";
      message: BleJsonMessage;
      raw: string;
      latencyMs?: number;
    }
  | {
      type: "log";
      timestamp: number;
      level: "info" | "success" | "warning" | "error";
      message: string;
    };

export type BleEventListener = (event: BleEvent) => void;

export interface ReactorBleService {
  connect(): Promise<BleConnection>;
  disconnect(): Promise<void>;
  scan(): Promise<BleScanResult[]>;
  sendPacket(packet: PacketInput): Promise<void>;
  subscribe(listener: BleEventListener): () => void;
  autoReconnect(enabled: boolean): void;
  getTransport(): BleTransport;
  isConnected(): boolean;
}

export type CommandIntent = CommandName;
