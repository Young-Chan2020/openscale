import type { ScaleProtocolAdapter } from "./types";

export const WEIGHT_SCALE_SERVICE_UUID = "0000181d-0000-1000-8000-00805f9b34fb";
export const WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID = "00002a9d-0000-1000-8000-00805f9b34fb";

function normalizeUuid(value: string) {
  const uuid = value.toLowerCase().replace(/[^a-f0-9]/g, "");
  const shortUuid = uuid.length <= 8 ? uuid.slice(-4) : uuid;
  return shortUuid.length === 4 ? `0000${shortUuid}00001000800000805f9b34fb` : uuid;
}

export const standardWeightScaleAdapter: ScaleProtocolAdapter = {
  id: "bluetooth-sig-weight-scale",
  displayName: "Bluetooth SIG Weight Scale",
  matchesAdvertisement: ({ serviceUUIDs }) =>
    serviceUUIDs.some(uuid => normalizeUuid(uuid) === normalizeUuid(WEIGHT_SCALE_SERVICE_UUID)),
};

export type WeightMeasurementPacket = {
  weightKg: number;
  flags: number;
  unit: "kg" | "lb";
  timestamp?: string;
  userId?: number;
  bmi?: number;
  heightCm?: number;
  rawHex: string;
};

export function parseWeightMeasurementDetailsBase64(value: string): WeightMeasurementPacket | null {
  try {
    const binary = decodeBase64(value);
    if (binary.length < 3) return null;
    const flags = binary[0];
    const rawWeight = binary[1] | (binary[2] << 8);
    if (rawWeight === 0 || rawWeight === 0xffff) return null;
    const isImperial = (flags & 0x01) !== 0;
    const weightKg = isImperial ? (rawWeight * 0.01) / 2.2046226218 : rawWeight * 0.005;
    if (!Number.isFinite(weightKg) || weightKg < 1 || weightKg > 500) return null;
    let offset = 3;
    let timestamp: string | undefined;
    let userId: number | undefined;
    let bmi: number | undefined;
    let heightCm: number | undefined;
    if ((flags & 0x02) !== 0 && binary.length >= offset + 7) {
      const year = binary[offset] | (binary[offset + 1] << 8);
      const month = binary[offset + 2], day = binary[offset + 3], hour = binary[offset + 4], minute = binary[offset + 5], second = binary[offset + 6];
      timestamp = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")} ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}`;
      offset += 7;
    }
    if ((flags & 0x04) !== 0 && binary.length >= offset + 1) userId = binary[offset++];
    if ((flags & 0x08) !== 0 && binary.length >= offset + 3) {
      const rawBmi = binary[offset] | (binary[offset + 1] << 8);
      const rawHeight = binary[offset + 2] | (binary[offset + 3] << 8);
      if (binary.length >= offset + 4) {
        if (rawBmi !== 0xffff) bmi = rawBmi * 0.1;
        if (rawHeight !== 0xffff) heightCm = isImperial ? rawHeight * 2.54 : rawHeight;
      }
    }
    return { weightKg: Math.round(weightKg * 1000) / 1000, flags, unit: isImperial ? "lb" : "kg", timestamp, userId, bmi, heightCm, rawHex: Array.from(binary).map(x=>x.toString(16).padStart(2,"0")).join(" ").toUpperCase() };
  } catch { return null; }
}

export function parseWeightMeasurementBase64(value: string): number | null {
  return parseWeightMeasurementDetailsBase64(value)?.weightKg ?? null;
}

export function decodeBase64(value: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, "");
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    if (char === "=") break;
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return Uint8Array.from(output);
}
