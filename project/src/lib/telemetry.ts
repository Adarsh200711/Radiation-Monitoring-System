import { db } from '@/lib/db';
import type { RadiationReading, Zone, AlertLevel } from '@/types';

export type ConnectionStatus = 'connected' | 'connecting' | 'offline';
export type OperationStatus = 'running' | 'processing' | 'completed' | 'idle' | 'failed';

interface TelemetryState {
  status: ConnectionStatus;
  isStreaming: boolean;
  frequencyMs: number;
  latestReading: RadiationReading | null;
  totalOperations: number;
  operationStatus: OperationStatus;
  statusMessage: string;
  lastUpdated: number; // timestamp in ms
}

type TelemetryListener = (state: TelemetryState) => void;

class TelemetryEngine {
  private state: TelemetryState = {
    status: 'connected',
    isStreaming: true,
    frequencyMs: 3000,
    latestReading: null,
    totalOperations: 142,
    operationStatus: 'running',
    statusMessage: 'Live Telemetry Active',
    lastUpdated: Date.now(),
  };

  private listeners = new Set<TelemetryListener>();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Load initial latest reading
    try {
      const readings = await db.getReadings(1);
      if (readings[0]) {
        this.state.latestReading = readings[0];
        this.state.lastUpdated = new Date(readings[0].timestamp).getTime();
      }
    } catch {
      //
    }
    this.startStream();
  }

  public getState(): TelemetryState {
    return { ...this.state };
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public setOperationStatus(status: OperationStatus, message: string) {
    this.state.operationStatus = status;
    this.state.statusMessage = message;
    this.state.totalOperations += 1;
    this.notify();
  }

  public setFrequency(ms: number) {
    this.state.frequencyMs = ms;
    if (this.state.isStreaming) {
      this.stopStream();
      this.startStream();
    }
    this.notify();
  }

  public startStream() {
    if (this.timer) clearInterval(this.timer);
    this.state.isStreaming = true;
    this.state.status = 'connected';
    this.state.operationStatus = 'running';
    this.state.statusMessage = 'Streaming live telemetry';

    this.timer = setInterval(async () => {
      await this.tickTelemetry();
    }, this.state.frequencyMs);

    this.notify();
  }

  public stopStream() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state.isStreaming = false;
    this.state.operationStatus = 'idle';
    this.state.statusMessage = 'Telemetry stream paused';
    this.notify();
  }

  public toggleStream() {
    if (this.state.isStreaming) {
      this.stopStream();
    } else {
      this.startStream();
    }
  }

  private async tickTelemetry() {
    try {
      const zones = await db.getZones();
      if (!zones || zones.length === 0) return;

      const randomZone = zones[Math.floor(Math.random() * zones.length)] as Zone;
      const limit = Number(randomZone.radiation_limit) || 5.0;

      // Realistic fluctuations around safe limit
      const rand = Math.random();
      let level: number;
      let alertLevel: AlertLevel = 'normal';

      if (rand < 0.05) {
        // Critical spike
        level = limit * (1.1 + Math.random() * 0.4);
        alertLevel = 'critical';
      } else if (rand < 0.2) {
        // Warning level
        level = limit * (0.7 + Math.random() * 0.28);
        alertLevel = 'warning';
      } else {
        // Normal baseline
        level = limit * (0.05 + Math.random() * 0.5);
        alertLevel = 'normal';
      }

      const rounded = Math.round(level * 1000) / 1000;
      const reading = await db.addReading({
        facility_id: randomZone.facility_id,
        zone_id: randomZone.id,
        radiation_level: rounded,
        unit: 'mSv/h',
        alert_level: alertLevel,
      });

      this.state.latestReading = reading;
      this.state.lastUpdated = Date.now();
      this.state.totalOperations += 1;
      this.state.status = 'connected';
      this.state.operationStatus = alertLevel === 'critical' ? 'failed' : alertLevel === 'warning' ? 'processing' : 'running';
      this.state.statusMessage = alertLevel === 'critical' ? 'High Radiation Alarm!' : alertLevel === 'warning' ? 'Warning Threshold Alert' : 'Nominal Telemetry';

      this.notify();
    } catch {
      this.state.status = 'offline';
      this.state.operationStatus = 'failed';
      this.state.statusMessage = 'Telemetry stream reconnecting...';
      this.notify();
    }
  }
}

export const telemetry = new TelemetryEngine();
