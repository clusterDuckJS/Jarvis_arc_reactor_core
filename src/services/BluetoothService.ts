import {
  ARC_REACTOR_COMMAND_CHARACTERISTIC_UUID,
  ARC_REACTOR_SERVICE_UUID,
  ARC_REACTOR_STATUS_CHARACTERISTIC_UUID,
  decodeJsonMessage,
  describeJsonMessage,
  encodeJsonMessage,
  normalizeStatusMessage,
  type PacketInput,
} from "@/services/BLEProtocol";
import { useReactorStore } from "@/store/useReactorStore";
import type {
  BleConnection,
  BleEvent,
  BleEventListener,
  BleScanResult,
  ReactorBleService,
} from "@/types/bluetooth";

const DEVICE_NAME = "Arc Reactor";
const decoder = new TextDecoder();

export const supportsWebBluetooth = (): boolean =>
  typeof navigator !== "undefined" && "bluetooth" in navigator;

export class BluetoothService implements ReactorBleService {
  private device: BluetoothDevice | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private statusCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners = new Set<BleEventListener>();
  private reconnectEnabled = true;
  private reconnectTimer: number | null = null;
  private userDisconnected = false;
  private connected = false;
  private lastRequestSentAt = new Map<string, number>();
  private writeQueue: Promise<void> = Promise.resolve();

  async scan(): Promise<BleScanResult[]> {
    if (!supportsWebBluetooth()) {
      throw new Error("Web Bluetooth is not available in this browser.");
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: DEVICE_NAME }, { namePrefix: DEVICE_NAME }],
      optionalServices: [ARC_REACTOR_SERVICE_UUID],
    });

    this.device = device;

    return [
      {
        id: device.id,
        name: device.name ?? DEVICE_NAME,
        transport: "web-bluetooth",
      },
    ];
  }

  async connect(): Promise<BleConnection> {
    if (!supportsWebBluetooth()) {
      throw new Error("Web Bluetooth is not available in this browser.");
    }

    this.userDisconnected = false;

    if (!this.device) {
      await this.scan();
    }

    return this.connectSelectedDevice();
  }

  async disconnect(): Promise<void> {
    this.userDisconnected = true;
    this.clearReconnectTimer();
    this.connected = false;

    if (this.statusCharacteristic) {
      this.statusCharacteristic.removeEventListener("characteristicvaluechanged", this.handleNotification);
      try {
        await this.statusCharacteristic.stopNotifications();
      } catch {
        this.emit({
          type: "log",
          timestamp: Date.now(),
          level: "warning",
          message: "Status notification shutdown was skipped by the device.",
        });
      }
    }

    this.device?.gatt?.disconnect();
    this.commandCharacteristic = null;
    this.statusCharacteristic = null;
    this.emit({ type: "disconnected", timestamp: Date.now(), reason: "Disconnected by operator." });
  }

  async sendPacket(packet: PacketInput): Promise<void> {
    if (!this.commandCharacteristic || !this.connected) {
      throw new Error("Arc Reactor is not connected.");
    }

    const payload = encodeJsonMessage(packet);
    const payloadBuffer = payload.buffer.slice(
      payload.byteOffset,
      payload.byteOffset + payload.byteLength,
    ) as ArrayBuffer;
    this.lastRequestSentAt.set(packet.requestId, performance.now());

    const write = this.writeQueue.then(async () => {
      const characteristic = this.commandCharacteristic;

      if (!characteristic || !this.connected) {
        throw new Error("Arc Reactor is not connected.");
      }

      if (characteristic.writeValueWithResponse) {
        await characteristic.writeValueWithResponse(payloadBuffer);
      } else {
        await characteristic.writeValue(payloadBuffer);
      }
    });
    this.writeQueue = write.catch(() => undefined);

    try {
      await write;
    } catch (error) {
      this.lastRequestSentAt.delete(packet.requestId);
      throw error;
    }

    const raw = decoder.decode(payload);
    this.emit({
      type: "packet",
      timestamp: Date.now(),
      direction: "tx",
      message: describeJsonMessage(packet),
      raw,
    });
    this.emit({ type: "json", timestamp: Date.now(), direction: "tx", message: packet, raw });
  }

  subscribe(listener: BleEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  autoReconnect(enabled: boolean): void {
    this.reconnectEnabled = enabled;
    if (!enabled) {
      this.clearReconnectTimer();
    }
  }

  getTransport(): "web-bluetooth" {
    return "web-bluetooth";
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async connectSelectedDevice(): Promise<BleConnection> {
    const device = this.device;

    if (!device?.gatt) {
      throw new Error("Selected Arc Reactor device does not expose a GATT server.");
    }

    device.removeEventListener("gattserverdisconnected", this.handleDisconnect);
    device.addEventListener("gattserverdisconnected", this.handleDisconnect);

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(ARC_REACTOR_SERVICE_UUID);
    this.commandCharacteristic = await service.getCharacteristic(
      ARC_REACTOR_COMMAND_CHARACTERISTIC_UUID,
    );
    this.statusCharacteristic = await service.getCharacteristic(
      ARC_REACTOR_STATUS_CHARACTERISTIC_UUID,
    );

    await this.statusCharacteristic.startNotifications();
    this.statusCharacteristic.removeEventListener("characteristicvaluechanged", this.handleNotification);
    this.statusCharacteristic.addEventListener("characteristicvaluechanged", this.handleNotification);

    this.connected = true;
    const connection: BleConnection = {
      id: device.id,
      name: device.name ?? DEVICE_NAME,
      transport: "web-bluetooth",
    };

    this.emit({ type: "connected", timestamp: Date.now(), connection });
    this.emit({
      type: "log",
      timestamp: Date.now(),
      level: "success",
      message: "Subscribed to Arc Reactor status notifications.",
    });

    return connection;
  }

  private handleNotification = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic | null;
    const value = characteristic?.value;

    if (!value) {
      return;
    }

    const raw = decoder.decode(value);

    try {
      const json = decodeJsonMessage(raw);
      const requestId =
        "requestId" in json && typeof json.requestId === "string" ? json.requestId : undefined;
      const sentAt = requestId ? this.lastRequestSentAt.get(requestId) : undefined;
      const latencyMs = typeof sentAt === "number" ? Math.round(performance.now() - sentAt) : undefined;
      const store = useReactorStore.getState();
      const status = normalizeStatusMessage(
        json,
        {
          power: store.power,
          brightness: store.brightness,
          mode: store.mode,
          speed: store.speed,
          color: store.color,
          effects: store.effects,
        },
        store.diagnostics,
      );

      if (requestId) {
        this.lastRequestSentAt.delete(requestId);
      }

      this.emit({
        type: "packet",
        timestamp: Date.now(),
        direction: "rx",
        message: describeJsonMessage(json),
        raw,
        ...(typeof latencyMs === "number" ? { latencyMs } : {}),
      });
      this.emit({
        type: "json",
        timestamp: Date.now(),
        direction: "rx",
        message: json,
        raw,
        ...(typeof latencyMs === "number" ? { latencyMs } : {}),
      });

      if (status) {
        this.emit({ type: "status", timestamp: Date.now(), status });
      } else if (json.type === "log" || json.type === "error" || json.type === "pong") {
        this.emit({
          type: "log",
          timestamp: Date.now(),
          level: json.type === "error" ? "error" : json.level ?? "info",
          message: json.message ?? raw,
        });
      }
    } catch (error) {
      this.emit({
        type: "log",
        timestamp: Date.now(),
        level: "error",
        message: `Invalid BLE JSON notification: ${String(error instanceof Error ? error.message : error)}`,
      });
    }
  };

  private handleDisconnect = (): void => {
    this.connected = false;
    this.commandCharacteristic = null;
    this.statusCharacteristic = null;
    this.emit({
      type: "disconnected",
      timestamp: Date.now(),
      reason: "GATT server disconnected.",
    });

    if (this.reconnectEnabled && !this.userDisconnected) {
      this.scheduleReconnect(1);
    }
  };

  private scheduleReconnect(attempt: number): void {
    this.clearReconnectTimer();
    const delay = Math.min(1_000 * attempt, 10_000);

    this.reconnectTimer = window.setTimeout(() => {
      void this.connectSelectedDevice().catch((error: unknown) => {
        this.emit({
          type: "log",
          timestamp: Date.now(),
          level: "warning",
          message: `Auto reconnect attempt ${attempt} failed: ${String(
            error instanceof Error ? error.message : error,
          )}`,
        });

        if (this.reconnectEnabled && !this.userDisconnected) {
          this.scheduleReconnect(attempt + 1);
        }
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit(event: BleEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
