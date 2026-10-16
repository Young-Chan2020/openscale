import Constants from "expo-constants";
import { Platform } from "react-native";
import type { BleManager as BleManagerType } from "react-native-ble-plx";

let manager: BleManagerType | null = null;
let unavailableReason: string | null = null;

/**
 * Resolve the native BLE module only when a user explicitly requests scanning.
 * This keeps Expo Go and web from crashing while importing the route.
 */
export function getBleManager(): BleManagerType | null {
  if (Platform.OS === "web") {
    unavailableReason = "網頁版不支援此藍牙模組。請在 iOS 或 Android 原生開發版本中使用。";
    return null;
  }

  if (Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient") {
    unavailableReason = "Expo Go 不包含此原生藍牙模組。請先建立並安裝 openScale 的 development build。";
    return null;
  }

  if (manager) return manager;
  try {
    const { BleManager } = require("react-native-ble-plx") as typeof import("react-native-ble-plx");
    manager = new BleManager();
    unavailableReason = null;
    return manager;
  } catch {
    unavailableReason = "無法載入原生藍牙模組。請重新建立並安裝 development build，確認已安裝 react-native-ble-plx。";
    return null;
  }
}

export function getBleUnavailableReason(): string {
  return unavailableReason ?? "目前無法使用藍牙。請確認你使用的是已安裝原生藍牙模組的開發版本。";
}
