import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import type { Device, BleError, Subscription } from "react-native-ble-plx";
import { SafeAreaView } from "react-native-safe-area-context";
import { addMeasurement } from "@/data/database";
import { getBleManager, getBleUnavailableReason } from "@/bluetooth/manager";
import {
  WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID,
  WEIGHT_SCALE_SERVICE_UUID,
  parseWeightMeasurementBase64,
  standardWeightScaleAdapter,
} from "@/bluetooth/protocols/standardWeightScale";
import { parseOkOkBroadcast } from "@/bluetooth/protocols/okokBroadcast";
import { colors, radii, spacing } from "@/theme";

type SessionState = "ready" | "scanning" | "connecting" | "waiting" | "success" | "error";

async function requestBlePermissions() {
  if (Platform.OS !== "android") return true;
  if (Number(Platform.Version) >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      && result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
  }
  return await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    === PermissionsAndroid.RESULTS.GRANTED;
}

export default function AutoMeasurementScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [session, setSession] = useState<SessionState>("ready");
  const [message, setMessage] = useState("按下開始後，讓體重秤保持開啟，再自然站上秤面。");
  const [weight, setWeight] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const managerRef = useRef<ReturnType<typeof getBleManager>>(null);
  const deviceRef = useRef<Device | null>(null);
  const monitorRef = useRef<Subscription | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const savedRef = useRef(false);
  const candidateHandledRef = useRef(false);

  const cleanup = useCallback(async (disconnect = true) => {
    activeRef.current = false;
    candidateHandledRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    monitorRef.current?.remove();
    monitorRef.current = null;
    managerRef.current?.stopDeviceScan();
    const device = deviceRef.current;
    deviceRef.current = null;
    if (disconnect && device) {
      try { await device.cancelConnection(); } catch {}
    }
  }, []);

  useEffect(() => () => { void cleanup(); }, [cleanup]);

  const fail = useCallback((title: string, detail: string) => {
    if (!activeRef.current) return;
    void cleanup();
    setSession("error");
    setMessage(title);
    setErrorDetails(detail);
  }, [cleanup]);

  const start = async () => {
    if (session === "scanning" || session === "connecting" || session === "waiting") {
      await cleanup();
      setSession("ready");
      setMessage("已取消本次稱重。");
      return;
    }

    const manager = getBleManager();
    if (!manager) {
      setSession("error");
      setMessage("目前無法使用藍牙");
      setErrorDetails(getBleUnavailableReason());
      return;
    }

    setWeight(null);
    setDeviceName(null);
    setErrorDetails(null);
    savedRef.current = false;
    candidateHandledRef.current = false;
    managerRef.current = manager;

    try {
      const permitted = await requestBlePermissions();
      if (!permitted) {
        setSession("error");
        setMessage("需要藍牙權限");
        setErrorDetails("請允許 openScale 搜尋附近的藍牙裝置，再重新開始稱重。");
        return;
      }
      const state = await manager.state();
      if (state !== "PoweredOn") {
        setSession("error");
        setMessage("請先開啟藍牙");
        setErrorDetails("請在手機系統設定中開啟藍牙，再重試。");
        return;
      }

      activeRef.current = true;
      setSession("scanning");
      setMessage("正在尋找支援標準體重秤服務的裝置…");
      timeoutRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        fail("暫時找不到相容的體重秤", "請確認體重秤已喚醒並靠近手機。目前已支援初步 OKOK／Chipsea 廣播格式及 Bluetooth SIG 標準體重秤服務；其他品牌協定會在後續逐步加入。");
      }, 45000);

      manager.startDeviceScan(null, { allowDuplicates: true }, async (scanError: BleError | null, device: Device | null) => {
        if (!activeRef.current) return;
        if (scanError) {
          fail("藍牙搜尋失敗", scanError.message);
          return;
        }
        if (!device || candidateHandledRef.current) return;

        // Some scales (including supported OKOK/Chipsea variants) broadcast
        // the final reading and never accept a GATT connection.
        const broadcast = device.manufacturerData
          ? parseOkOkBroadcast(device.manufacturerData, device.name, device.localName)
          : null;
        if (broadcast) {
          candidateHandledRef.current = true;
          manager.stopDeviceScan();
          setSession("waiting");
          setDeviceName(device.name || device.localName || broadcast.displayName);
          setMessage("已收到體重秤的完成廣播，正在儲存測量結果…");
          savedRef.current = true;
          try {
            await addMeasurement(db, {
              weightKg: broadcast.weightKg,
              timestamp: Date.now(),
              note: `Bluetooth broadcast: ${broadcast.displayName}`,
            });
            if (!activeRef.current) return;
            setWeight(broadcast.weightKg);
            setSession("success");
            setMessage(`已透過 ${broadcast.displayName} 廣播讀取並儲存體重。`);
            await cleanup();
          } catch (saveError) {
            savedRef.current = false;
            fail("無法儲存測量結果", saveError instanceof Error ? saveError.message : "請稍後重試。");
          }
          return;
        }

        if (!standardWeightScaleAdapter.matchesAdvertisement({
          serviceUUIDs: device.serviceUUIDs ?? [],
          manufacturerData: device.manufacturerData,
          name: device.name,
          localName: device.localName,
        })) return;

        candidateHandledRef.current = true;
        manager.stopDeviceScan();
        setSession("connecting");
        setMessage(`已找到 ${device.name || device.localName || "體重秤"}，正在連線…`);
        setDeviceName(device.name || device.localName || "體重秤");
        try {
          const connected = await manager.connectToDevice(device.id, { timeout: 12000 });
          if (!activeRef.current) {
            try { await connected.cancelConnection(); } catch {}
            return;
          }
          deviceRef.current = connected;
          const discovered = await connected.discoverAllServicesAndCharacteristics();
          const services = await discovered.services();
          const hasScaleService = services.some(service => service.uuid.toLowerCase() === WEIGHT_SCALE_SERVICE_UUID);
          if (!hasScaleService) {
            fail("裝置協定尚未支援", "已連接裝置，但找不到標準 Weight Scale Service。這款秤可能使用廠商自訂協定。");
            return;
          }
          const characteristics = await discovered.characteristicsForService(WEIGHT_SCALE_SERVICE_UUID);
          const measurementCharacteristic = characteristics.find(characteristic =>
            characteristic.uuid.toLowerCase() === WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID
            && characteristic.isNotifiable,
          );
          if (!measurementCharacteristic) {
            fail("無法讀取體重資料", "裝置沒有提供可訂閱的標準 Weight Measurement 特徵值。");
            return;
          }

          setSession("waiting");
          setMessage("連線成功！請站上體重秤，等待測量結果…");
          monitorRef.current = discovered.monitorCharacteristicForService(
            WEIGHT_SCALE_SERVICE_UUID,
            WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID,
            async (monitorError, characteristic) => {
              if (!activeRef.current || savedRef.current) return;
              if (monitorError) {
                fail("讀取測量資料失敗", monitorError.message);
                return;
              }
              const value = characteristic?.value;
              if (!value) return;
              const parsedWeight = parseWeightMeasurementBase64(value);
              if (parsedWeight == null) return;
              savedRef.current = true;
              try {
                await addMeasurement(db, {
                  weightKg: parsedWeight,
                  timestamp: Date.now(),
                  note: `Bluetooth: ${connected.name || connected.localName || connected.id}`,
                });
                if (!activeRef.current) return;
                setWeight(parsedWeight);
                setSession("success");
                setMessage("測量完成，已儲存到本機紀錄。");
                await cleanup();
              } catch (saveError) {
                savedRef.current = false;
                fail("無法儲存測量結果", saveError instanceof Error ? saveError.message : "請稍後重試。");
              }
            },
          );
        } catch (connectError) {
          fail("無法連接體重秤", connectError instanceof Error ? connectError.message : "請確認體重秤已喚醒後重試。");
        }
      });
    } catch (startError) {
      await cleanup();
      setSession("error");
      setMessage("無法開始稱重");
      setErrorDetails(startError instanceof Error ? startError.message : "請檢查藍牙設定後重試。");
    }
  };

  const busy = session === "scanning" || session === "connecting" || session === "waiting";
  const statusIcon = session === "success" ? "checkmark-circle" : session === "error" ? "alert-circle" : busy ? "bluetooth" : "scale-outline";
  const statusColor = session === "success" ? colors.teal : session === "error" ? colors.danger : colors.primary;

  return <SafeAreaView style={s.safe} edges={["bottom"]}>
    <View style={s.content}>
      <Pressable style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="返回">
        <Ionicons name="chevron-back" size={21} color={colors.ink} /><Text style={s.backText}>返回</Text>
      </Pressable>
      <View style={s.header}>
        <Text style={s.kicker}>SEAMLESS WEIGH-IN</Text>
        <Text style={s.title}>開始稱重</Text>
        <Text style={s.subtitle}>不用手動選擇藍牙裝置。先搜尋相容體重秤，連線後站上秤面即可。</Text>
      </View>
      <View style={s.statusCard}>
        <View style={[s.statusIcon, { backgroundColor: session === "success" ? "#DDF7EA" : session === "error" ? "#FDE8E7" : colors.primarySoft }]}>
          {busy ? <ActivityIndicator size="large" color={statusColor} /> : <Ionicons name={statusIcon} size={34} color={statusColor} />}
        </View>
        {weight != null ? <View style={s.weightLine}><Text style={s.weight}>{weight.toFixed(1)}</Text><Text style={s.unit}>kg</Text></View> : null}
        <Text style={s.statusTitle}>{session === "success" ? "稱重完成" : session === "scanning" ? "正在搜尋" : session === "connecting" ? "正在連線" : session === "waiting" ? "請站上體重秤" : session === "error" ? "需要處理一下" : "準備就緒"}</Text>
        <Text style={s.message}>{message}</Text>
        {deviceName ? <Text style={s.device}>裝置：{deviceName}</Text> : null}
        {errorDetails ? <Text style={s.errorDetails}>{errorDetails}</Text> : null}
        <Pressable style={[s.primaryButton, busy && s.cancelButton]} onPress={() => void start()}>
          <Ionicons name={busy ? "close" : session === "success" ? "refresh" : "scale-outline"} size={19} color="#fff" />
          <Text style={s.primaryButtonText}>{busy ? "取消稱重" : session === "success" ? "再量一次" : session === "error" ? "重試" : "開始搜尋體重秤"}</Text>
        </Pressable>
        {session === "error" ? <Pressable style={s.secondaryButton} onPress={() => router.push("/(tabs)/devices")}><Text style={s.secondaryButtonText}>開啟藍牙裝置診斷</Text></Pressable> : null}
      </View>
      <View style={s.infoCard}>
        <Ionicons name="information-circle-outline" size={19} color={colors.primary} />
        <View style={s.infoCopy}>
          <Text style={s.infoTitle}>目前的協定支援範圍</Text>
          <Text style={s.infoText}>目前已實作 Bluetooth SIG 標準 Weight Scale Service，以及原版 openScale 中部分 OKOK／Chipsea 廣播格式的體重解析。很多體脂秤仍使用其他廠商自訂廣播或 GATT 協定；若你的體重秤不相容，App 不會假裝讀到了數據，我們會再逐步擴充。</Text>
        </View>
      </View>
    </View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, padding: spacing.md, gap: 16 },
  back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 4, paddingRight: 10, gap: 3 },
  backText: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  header: { gap: 7, paddingTop: 4 },
  kicker: { color: colors.primary, fontSize: 10, letterSpacing: 1.6, fontWeight: "800" },
  title: { color: colors.ink, fontSize: 31, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.secondary, fontSize: 13, lineHeight: 20 },
  statusCard: { alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 23, gap: 13 },
  statusIcon: { width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  weightLine: { flexDirection: "row", alignItems: "baseline", gap: 7, marginTop: 3 },
  weight: { color: colors.ink, fontSize: 58, lineHeight: 64, fontWeight: "800", letterSpacing: -2 },
  unit: { color: colors.secondary, fontSize: 18, fontWeight: "700" },
  statusTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", textAlign: "center" },
  message: { color: colors.secondary, fontSize: 13, lineHeight: 20, textAlign: "center" },
  device: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  errorDetails: { color: colors.danger, fontSize: 12, lineHeight: 18, textAlign: "center" },
  primaryButton: { width: "100%", backgroundColor: colors.primary, borderRadius: 15, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  cancelButton: { backgroundColor: colors.danger },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  secondaryButton: { paddingVertical: 8, paddingHorizontal: 12 },
  secondaryButtonText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primarySoft, borderRadius: 15, padding: 14 },
  infoCopy: { flex: 1, gap: 5 },
  infoTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  infoText: { color: colors.secondary, fontSize: 11, lineHeight: 17 },
});
