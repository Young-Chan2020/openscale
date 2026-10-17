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

/**
 * Decode Bluetooth SIG Weight Measurement (0x2A9D).
 * Flags bit 0 selects units: 0 = kg (0.005 kg resolution), 1 = lb (0.01 lb).
 * Optional timestamp, user ID and BMI/height fields follow the weight field.
 * Unknown trailing fields are intentionally ignored.
 */
export function parseWeightMeasurementBase64(value: string): number | null {
  try {
    const binary = decodeBase64(value);
    if (binary.length < 3) return null;
    const flags = binary[0];
    const rawWeight = binary[1] | (binary[2] << 8);
    if (rawWeight === 0 || rawWeight === 0xffff) return null;

    const isImperial = (flags & 0x01) !== 0;
    const weight = isImperial ? (rawWeight * 0.01) / 2.2046226218 : rawWeight * 0.005;
    if (!Number.isFinite(weight) || weight < 1 || weight > 500) return null;
    return Math.round(weight * 1000) / 1000;
  } catch {
    return null;
  }
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
