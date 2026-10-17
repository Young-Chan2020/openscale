import { decodeBase64 } from "./standardWeightScale";

export type BroadcastWeight = {
  weightKg: number;
  protocolId: string;
  displayName: string;
};

const OKOK_V20 = 0x20ca;
const OKOK_V11 = 0x11ca;
const OKOK_VF0 = 0xf0ff;

function u8(value: number | undefined) {
  return value == null ? 0 : value & 0xff;
}
function u16be(msb: number, lsb: number) {
  return (u8(msb) << 8) | u8(lsb);
}
function plausible(weightKg: number) {
  return Number.isFinite(weightKg) && weightKg >= 1 && weightKg <= 300;
}
function knownOkOkName(name?: string | null, localName?: string | null) {
  const value = `${name ?? ""} ${localName ?? ""}`.trim().toLowerCase();
  return value === "adv" || value.includes("chipsea-ble") || value.startsWith("yoda0") || value.startsWith("yoda1");
}

/**
 * Decode known OKOK/Chipsea broadcast variants from the original openScale
 * protocol implementation. This is intentionally weight-only: impedance/body
 * composition fields are not imported until those metrics have their own
 * validated domain mapping.
 *
 * BLE libraries differ in whether manufacturerData includes the 2-byte company
 * identifier. Try both forms and require a valid checksum where that protocol
 * defines one.
 */
export function parseOkOkBroadcast(
  base64: string,
  name?: string | null,
  localName?: string | null,
): BroadcastWeight | null {
  const raw = [...decodeBase64(base64)];
  if (!raw.length) return null;
  const trustedName = knownOkOkName(name, localName);

  const candidates: Array<{ companyId: number | null; data: number[] }> = [{ companyId: null, data: raw }];
  if (raw.length >= 3) {
    const companyId = raw[0] | (raw[1] << 8);
    if (companyId === OKOK_V20 || companyId === OKOK_V11 || companyId === OKOK_VF0 || (companyId & 0xff) === 0xc0) {
      candidates.unshift({ companyId, data: raw.slice(2) });
    }
  }

  for (const candidate of candidates) {
    const { companyId, data } = candidate;

    // OKOK V20: final/stable frame, weight and XOR checksum.
    if ((companyId === OKOK_V20 || companyId == null) && data.length === 19) {
      let checksum = 0x20;
      for (let i = 0; i < 12; i++) checksum ^= u8(data[i]);
      const stable = (u8(data[6]) & 0x01) !== 0;
      if (stable && checksum === u8(data[12])) {
        const divider = (u8(data[6]) & 0x04) !== 0 ? 100 : 10;
        const weightKg = u16be(data[8], data[9]) / divider;
        if (plausible(weightKg)) return { weightKg, protocolId: "okok-v20-broadcast", displayName: "OKOK V20" };
      }
    }

    // OKOK V11: checksum, unit and resolution encoded in body properties.
    if ((companyId === OKOK_V11 || companyId == null) && data.length === 23) {
      let checksum = 0xca ^ 0x11;
      for (let i = 0; i < 16; i++) checksum ^= u8(data[i]);
      if (checksum === u8(data[16])) {
        const props = u8(data[9]);
        const divider = [10, 1, 100, 10][(props >> 1) & 0x03];
        const rawWeight = u16be(data[3], data[4]);
        let weightKg: number | null = null;
        switch ((props >> 3) & 0x03) {
          case 0: weightKg = rawWeight / divider; break;
          case 1: weightKg = rawWeight / divider / 2; break;
          case 2: weightKg = rawWeight / divider / 2.204623; break;
          case 3: weightKg = (rawWeight >> 8) * 6.350293 + ((rawWeight & 0xff) / divider) * 0.453592; break;
        }
        if (weightKg != null && plausible(weightKg)) return { weightKg, protocolId: "okok-v11-broadcast", displayName: "OKOK V11" };
      }
    }

    // OKOK VF0 has no checksum; only accept it for a recognizable scale name
    // or when its manufacturer identifier is present.
    if ((companyId === OKOK_VF0 || (companyId == null && trustedName)) && data.length >= 4) {
      const weightKg = u16be(data[3], data[2]) / 10;
      if (plausible(weightKg)) return { weightKg, protocolId: "okok-vf0-broadcast", displayName: "OKOK VF0" };
    }

    // OKOK C0 embeds unit/resolution and a stable flag in the advertisement.
    if (companyId != null && (companyId & 0xff) === 0xc0 && data.length >= 13) {
      const attrib = u8(data[6]);
      if ((attrib & 0x01) === 0) continue;
      const divider = [10, 1, 100, 10][(attrib >> 1) & 0x03];
      const rawWeight = u16be(data[0], data[1]);
      let weightKg: number | null = null;
      switch ((attrib >> 3) & 0x03) {
        case 0: weightKg = rawWeight / divider; break;
        case 1: weightKg = rawWeight / divider / 2; break;
        case 2: weightKg = rawWeight / divider / 2.204623; break;
        case 3: weightKg = u8(data[0]) * 6.350293 + (u8(data[1]) / divider) * 0.453592; break;
      }
      if (weightKg != null && plausible(weightKg)) return { weightKg, protocolId: "okok-c0-broadcast", displayName: "OKOK C0" };
    }
  }

  return null;
}
