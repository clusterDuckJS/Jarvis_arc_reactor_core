import { BluetoothService } from "@/services/BluetoothService";
import type {
  BleConnection,
  BleEvent,
  BleEventListener,
  BleScanResult,
  BleTransport,
  ReactorBleService,
} from "@/types/bluetooth";
import type { PacketInput } from "@/services/BLEProtocol";

class AutoBleService implements ReactorBleService {
  private readonly web = new BluetoothService();
  private listeners = new Set<BleEventListener>();
  private active: ReactorBleService = this.web;

  constructor() {
    this.web.subscribe((event) => this.emit(event));
  }

  async connect(): Promise<BleConnection> {
    this.active = this.web;
    return this.web.connect();
  }

  async disconnect(): Promise<void> {
    await this.active.disconnect();
  }

  async scan(): Promise<BleScanResult[]> {
    this.active = this.web;
    return this.web.scan();
  }

  async sendPacket(packet: PacketInput): Promise<void> {
    await this.active.sendPacket(packet);
  }

  subscribe(listener: BleEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  autoReconnect(enabled: boolean): void {
    this.web.autoReconnect(enabled);
  }

  getTransport(): BleTransport {
    return this.active.getTransport();
  }

  isConnected(): boolean {
    return this.active.isConnected();
  }

  private emit(event: BleEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

export const bleService = new AutoBleService();
