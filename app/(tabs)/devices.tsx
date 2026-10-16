import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Device } from "react-native-ble-plx";
import { Page, Panel } from "@/components/Page";
import { getBleManager, getBleUnavailableReason } from "@/bluetooth/manager";
import { colors } from "@/theme";

async function requestScanPermission() {
  if (Platform.OS !== "android") return true;
  if (Number(Platform.Version) >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      && result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export default function DevicesScreen() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [status, setStatus] = useState("尚未開始搜尋");
  const [bleState, setBleState] = useState("尚未檢查");
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopScan = useCallback(() => {
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
      scanTimer.current = null;
    }
    const manager = getBleManager();
    manager?.stopDeviceScan();
    setScanning(false);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      setBleState("網頁版不支援");
      setUnsupported("網頁版不支援此原生藍牙模組。請使用 iOS／Android 開發版本測試藍牙。");
      return;
    }
    const manager = getBleManager();
    if (!manager) {
      setBleState("需要原生開發版本");
      setUnsupported(getBleUnavailableReason());
      return;
    }
    const subscription = manager.onStateChange(state => {
      setBleState(state === "PoweredOn" ? "藍牙已開啟" : state === "PoweredOff" ? "藍牙已關閉" : state);
    }, true);
    return () => subscription.remove();
  }, []);

  useFocusEffect(useCallback(() => () => {
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
      scanTimer.current = null;
    }
    // Do not instantiate a manager just to stop a scan while leaving this screen.
    try {
      if (Platform.OS !== "web") {
        const manager = getBleManager();
        manager?.stopDeviceScan();
      }
    } catch {}
    setScanning(false);
  }, []));

  const startScan = async () => {
    if (scanning) {
      stopScan();
      setStatus("已停止搜尋");
      return;
    }
    if (Platform.OS === "web") {
      setUnsupported("網頁版不支援此原生藍牙模組。請使用 iOS／Android 開發版本測試藍牙。");
      setStatus("目前平台不支援藍牙掃描");
      return;
    }
    const manager = getBleManager();
    if (!manager) {
      const reason = getBleUnavailableReason();
      setUnsupported(reason);
      setBleState("無法使用");
      setStatus(reason);
      Alert.alert("目前無法使用藍牙", reason);
      return;
    }
    setUnsupported(null);
    try {
      const permitted = await requestScanPermission();
      if (!permitted) {
        setStatus("尚未取得藍牙權限");
        Alert.alert("需要藍牙權限", "請在系統設定中允許 openScale 搜尋附近的藍牙裝置。");
        return;
      }
      const state = await manager.state();
      setBleState(state === "PoweredOn" ? "藍牙已開啟" : state);
      if (state !== "PoweredOn") {
        setStatus("請先開啟裝置的藍牙");
        Alert.alert("請開啟藍牙", "請先在裝置的系統設定中開啟藍牙，再重新搜尋。");
        return;
      }
      setDevices([]);
      seen.current.clear();
      setStatus("正在搜尋附近的藍牙裝置…");
      setScanning(true);
      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          manager.stopDeviceScan();
          setScanning(false);
          setStatus("搜尋失敗，請檢查藍牙權限後重試。");
          Alert.alert("藍牙搜尋失敗", error.message);
          return;
        }
        if (device && !seen.current.has(device.id)) {
          seen.current.add(device.id);
          setDevices(current => [...current, device].sort((a, b) => (a.name ?? a.localName ?? a.id).localeCompare(b.name ?? b.localName ?? b.id)));
        }
      });
      scanTimer.current = setTimeout(() => {
        manager.stopDeviceScan();
        scanTimer.current = null;
        setScanning(false);
        setStatus("搜尋完成。若體重秤沒有出現，請確認它已喚醒並支援藍牙廣播。");
      }, 12000);
    } catch (error) {
      manager.stopDeviceScan();
      setScanning(false);
      const message = error instanceof Error ? error.message : "未知錯誤";
      setStatus("無法開始搜尋");
      Alert.alert("無法使用藍牙", message);
    }
  };

  return <Page title="藍牙裝置" subtitle="搜尋附近的體重秤與其他低功耗藍牙裝置。">
    <Panel title="裝置搜尋" eyebrow="藍牙搜尋">
      <View style={s.stateRow}><View style={[s.dot,{backgroundColor:bleState==="藍牙已開啟"?colors.teal:colors.amber}]}/><Text style={s.state}>{bleState}</Text></View>
      <Text style={s.description}>搜尋時請讓體重秤保持開啟，並靠近手機。部分體重秤只有站上秤面或喚醒後才會廣播訊號。</Text>
      {unsupported ? <View style={s.warning}><Ionicons name="information-circle-outline" size={18} color={colors.primary}/><Text style={[s.description,{flex:1}]}>{unsupported}</Text></View> : null}
      <Pressable onPress={() => void startScan()} style={[s.button,scanning&&s.stopButton]}>
        {scanning ? <ActivityIndicator color="#fff" size="small"/> : <Ionicons name="bluetooth" size={19} color="#fff"/>}
        <Text style={s.buttonText}>{scanning ? "停止搜尋" : "搜尋藍牙裝置"}</Text>
      </Pressable>
      <Text style={s.status}>{status}</Text>
    </Panel>
    <Panel title={`搜尋結果（${devices.length}）`} eyebrow="附近裝置">
      {devices.length===0 ? <View style={s.empty}><Ionicons name="bluetooth-outline" size={30} color={colors.muted}/><Text style={s.emptyTitle}>{scanning?"正在等待裝置回應…":"尚未找到裝置"}</Text><Text style={s.description}>找到的裝置會列在這裡。目前這一步只負責發現藍牙裝置，尚未解析體重秤封包或匯入體重數據。</Text></View> :
      devices.map(device=><View key={device.id} style={s.deviceRow}><View style={s.deviceIcon}><Ionicons name="hardware-chip-outline" size={19} color={colors.primary}/></View><View style={s.deviceInfo}><Text style={s.deviceName}>{device.name||device.localName||"未命名裝置"}</Text><Text selectable style={s.deviceId}>{device.id}</Text><Text style={s.deviceMeta}>{device.rssi==null?"訊號強度未知":`訊號強度：${device.rssi} dBm`}{device.manufacturerData?" · 已收到製造商資料":""}</Text></View></View>)}
    </Panel>
    <View style={s.notice}><Ionicons name="information-circle-outline" size={18} color={colors.primary}/><Text style={s.description}>藍牙掃描需要安裝包含原生模組的 iOS／Android 開發版本；Expo Go 不支援此功能。不同品牌的體重秤協定仍需個別辨識與驗證。</Text></View>
  </Page>;
}

const s=StyleSheet.create({
 stateRow:{flexDirection:"row",alignItems:"center",gap:8},dot:{width:8,height:8,borderRadius:4},state:{fontSize:13,color:colors.ink,fontWeight:"700"},
 description:{fontSize:12,color:colors.secondary,lineHeight:19},button:{backgroundColor:colors.primary,borderRadius:14,paddingVertical:13,paddingHorizontal:15,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8},stopButton:{backgroundColor:colors.danger},buttonText:{fontSize:13,color:"#fff",fontWeight:"800"},status:{fontSize:11,color:colors.muted,lineHeight:17},
 empty:{alignItems:"center",paddingVertical:20,gap:9},emptyTitle:{fontSize:14,color:colors.ink,fontWeight:"700"},deviceRow:{flexDirection:"row",alignItems:"center",gap:11,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},deviceIcon:{width:38,height:38,borderRadius:13,backgroundColor:colors.primarySoft,alignItems:"center",justifyContent:"center"},deviceInfo:{flex:1,gap:3},deviceName:{fontSize:13,color:colors.ink,fontWeight:"800"},deviceId:{fontSize:10,color:colors.secondary},deviceMeta:{fontSize:10,color:colors.muted},notice:{flexDirection:"row",alignItems:"flex-start",gap:9,backgroundColor:colors.primarySoft,padding:13,borderRadius:14},warning:{flexDirection:"row",alignItems:"flex-start",gap:8,padding:11,backgroundColor:colors.primarySoft,borderRadius:12}
});
