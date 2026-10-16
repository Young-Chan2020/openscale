import { BleManager } from "react-native-ble-plx";

// Keep one manager for the app lifetime; screens should stop scans when they blur.
export const bleManager = new BleManager();
