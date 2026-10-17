export type ScaleMeasurement = {
  weightKg: number;
  measuredAt: number;
  protocolId: string;
  deviceId: string;
  deviceName: string;
};

export type ProtocolMatch = {
  protocolId: string;
  displayName: string;
  confidence: "verified" | "candidate";
};

/**
 * A protocol adapter describes how a scale is recognized and how a reading
 * is decoded. Advertisement and GATT adapters can share the same session UI.
 */
export interface ScaleProtocolAdapter {
  readonly id: string;
  readonly displayName: string;
  matchesAdvertisement(input: {
    serviceUUIDs: string[];
    manufacturerData?: string | null;
    name?: string | null;
    localName?: string | null;
  }): boolean;
}
