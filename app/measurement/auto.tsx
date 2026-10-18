import {useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,Modal,PermissionsAndroid,Platform,Pressable,ScrollView,StyleSheet,Text,View} from "react-native";
import {useRouter} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Ionicons} from "@expo/vector-icons";
import type {Device,BleError,Subscription} from "react-native-ble-plx";
import {SafeAreaView} from "react-native-safe-area-context";
import {addMeasurement} from "@/data/database";
import {getBleManager} from "@/bluetooth/manager";
import {WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID,WEIGHT_SCALE_SERVICE_UUID,parseWeightMeasurementDetailsBase64,standardWeightScaleAdapter} from "@/bluetooth/protocols/standardWeightScale";
import {parseOkOkBroadcast} from "@/bluetooth/protocols/okokBroadcast";
import {radii,spacing,type Palette} from "@/theme";
import {useAppPreferences} from "@/providers/AppPreferences";

type SessionState="ready"|"scanning"|"connecting"|"waiting"|"success"|"error";
async function requestBlePermissions(){
 if(Platform.OS!=="android")return true;
 if(Number(Platform.Version)>=31){const result=await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]);return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]===PermissionsAndroid.RESULTS.GRANTED&&result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]===PermissionsAndroid.RESULTS.GRANTED;}
 return await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)===PermissionsAndroid.RESULTS.GRANTED;
}
export default function AutoMeasurementScreen(){
 const db=useSQLiteContext(),router=useRouter(),{colors,t}=useAppPreferences();
 const [session,setSession]=useState<SessionState>("ready"),[weight,setWeight]=useState<number|null>(null),[message,setMessage]=useState(t("startPrompt")),[debugOpen,setDebugOpen]=useState(false),[debugLogs,setDebugLogs]=useState<string[]>([]),[debugTaps,setDebugTaps]=useState(0);
 const managerRef=useRef<ReturnType<typeof getBleManager>>(null),deviceRef=useRef<Device|null>(null),monitorRef=useRef<Subscription|null>(null),timeoutRef=useRef<ReturnType<typeof setTimeout>|null>(null),activeRef=useRef(false),savedRef=useRef(false),candidateHandledRef=useRef(false);
 const appendLog=useCallback((label:string,data?:unknown)=>{const line=`[${new Date().toISOString()}] ${label}${data===undefined?"":"\n"+(typeof data==="string"?data:JSON.stringify(data,null,2))}`;setDebugLogs(prev=>[...prev,line].slice(-120));},[]);
 const cleanup=useCallback(async()=>{activeRef.current=false;candidateHandledRef.current=false;if(timeoutRef.current){clearTimeout(timeoutRef.current);timeoutRef.current=null;}monitorRef.current?.remove();monitorRef.current=null;managerRef.current?.stopDeviceScan();const device=deviceRef.current;deviceRef.current=null;if(device){try{await device.cancelConnection();}catch{}}},[]);
 useEffect(()=>()=>{void cleanup();},[cleanup]);
 const fail=useCallback((title:string)=>{if(!activeRef.current)return;void cleanup();setSession("error");setMessage(title);},[cleanup]);
 const start=async()=>{
  if(["scanning","connecting","waiting"].includes(session)){await cleanup();setSession("ready");setMessage(t("startPrompt"));return;}
  const manager=getBleManager();if(!manager){setSession("error");setMessage(t("readFailed"));return;}
  setWeight(null);savedRef.current=false;candidateHandledRef.current=false;managerRef.current=manager;setDebugLogs([]);setDebugTaps(0);appendLog("測量開始",{platform:Platform.OS});
  try{
   if(!await requestBlePermissions()){appendLog("藍牙權限未授予");setSession("error");setMessage(t("bluetoothPermissionMessage"));return;}
   if(await manager.state()!=="PoweredOn"){appendLog("藍牙未開啟");setSession("error");setMessage(t("bluetoothOff"));return;}
   activeRef.current=true;setSession("scanning");setMessage(t("pleaseStepOn"));appendLog("開始掃描附近裝置");
   timeoutRef.current=setTimeout(()=>{if(activeRef.current)fail(t("scaleNotFound"));},45000);
   manager.startDeviceScan(null,{allowDuplicates:true},async(error:BleError|null,device:Device|null)=>{
    if(!activeRef.current)return;if(error){appendLog("掃描錯誤",{message:error.message,errorCode:error.errorCode});fail(t("readFailed"));return;}if(!device)return;
    appendLog("收到裝置廣播",{id:device.id,name:device.name,localName:device.localName,rssi:device.rssi,serviceUUIDs:device.serviceUUIDs,manufacturerData:device.manufacturerData,serviceData:device.serviceData,solicitedServiceUUIDs:device.solicitedServiceUUIDs});
    if(candidateHandledRef.current)return;
    const broadcast=device.manufacturerData?parseOkOkBroadcast(device.manufacturerData,device.name,device.localName):null;
    if(broadcast){appendLog("解析到 OKOK 廣播",{weightKg:broadcast.weightKg,protocolId:broadcast.protocolId,displayName:broadcast.displayName,manufacturerData:device.manufacturerData});candidateHandledRef.current=true;manager.stopDeviceScan();savedRef.current=true;try{await addMeasurement(db,{weightKg:broadcast.weightKg,timestamp:Date.now(),note:null});if(!activeRef.current)return;setWeight(broadcast.weightKg);setSession("success");setMessage(t("savedReading"));await cleanup();}catch{savedRef.current=false;fail(t("saveFailed"));}return;}
    if(!standardWeightScaleAdapter.matchesAdvertisement({serviceUUIDs:device.serviceUUIDs??[],manufacturerData:device.manufacturerData,name:device.name,localName:device.localName}))return;
    appendLog("符合標準體重秤服務",{deviceId:device.id,name:device.name,localName:device.localName,serviceUUIDs:device.serviceUUIDs});candidateHandledRef.current=true;manager.stopDeviceScan();setSession("connecting");setMessage(t("connecting"));
    try{
     const connected=await manager.connectToDevice(device.id,{timeout:12000});appendLog("已連接裝置",{id:connected.id,name:connected.name,mtu:connected.mtu});if(!activeRef.current){try{await connected.cancelConnection();}catch{}return;}deviceRef.current=connected;
     const discovered=await connected.discoverAllServicesAndCharacteristics();const services=await discovered.services();appendLog("發現的服務",services.map(s=>({uuid:s.uuid,isPrimary:s.isPrimary})));
     if(!services.some(s=>s.uuid.toLowerCase()===WEIGHT_SCALE_SERVICE_UUID)){fail(t("readFailed"));return;}
     const chars=await discovered.characteristicsForService(WEIGHT_SCALE_SERVICE_UUID);appendLog("體重秤服務特徵",chars.map(ch=>({uuid:ch.uuid,isReadable:ch.isReadable,isWritableWithResponse:ch.isWritableWithResponse,isWritableWithoutResponse:ch.isWritableWithoutResponse,isNotifiable:ch.isNotifiable,isIndicatable:ch.isIndicatable})));
     if(!chars.some(c=>c.uuid.toLowerCase()===WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID&&c.isNotifiable)){fail(t("readFailed"));return;}
     setSession("waiting");setMessage(t("pleaseStepOn"));
     monitorRef.current=discovered.monitorCharacteristicForService(WEIGHT_SCALE_SERVICE_UUID,WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID,async(monitorError,characteristic)=>{
       if(!activeRef.current||savedRef.current)return;
       if(monitorError){appendLog("測量通知錯誤",{message:monitorError.message,errorCode:monitorError.errorCode});fail(t("readFailed"));return;}
       if(!characteristic?.value)return;
       const packet=parseWeightMeasurementDetailsBase64(characteristic.value);
       appendLog("收到測量通知",{characteristicUUID:characteristic.uuid,base64:characteristic.value,parsed:packet});
       const parsed=packet?.weightKg??null;if(parsed==null)return;
       savedRef.current=true;
       try{
        const values=packet?[
         ...(packet.bmi==null?[]:[{key:"bmi",value:packet.bmi,unit:"kg/m²",source:"scale" as const}]),
         ...(packet.heightCm==null?[]:[{key:"height",value:packet.heightCm,unit:"cm",source:"scale" as const}])
        ]:[];
        await addMeasurement(db,{weightKg:parsed,timestamp:Date.now(),note:null,values});
        if(!activeRef.current)return;setWeight(parsed);setSession("success");setMessage(t("savedReading"));await cleanup();
       }catch{savedRef.current=false;fail(t("saveFailed"));}
     });
    }catch{fail(t("scaleNotFound"));}
   });
  }catch(error){appendLog("測量流程發生錯誤",error instanceof Error?{message:error.message,stack:error.stack}:String(error));await cleanup();setSession("error");setMessage(t("tryAgainMessage"));}
 };
 const busy=["scanning","connecting","waiting"].includes(session);
 const s=makeStyles(colors);
 return <SafeAreaView style={s.safe} edges={["top","bottom"]}><View style={s.content}>
 <Pressable style={s.back} onPress={()=>router.back()} accessibilityRole="button" accessibilityLabel={t("back")} hitSlop={6}><Ionicons name="chevron-back" size={22} color={colors.ink}/><Text style={s.backText}>{t("back")}</Text></Pressable>
 <View style={s.header}><Text style={s.title}>{t("startWeighing")}</Text><Text style={s.subtitle}>{session==="success"?t("savedReading"):busy?t("pleaseStepOn"):session==="error"?message:t("startPrompt")}</Text></View>
 <View style={s.card}><View style={[s.icon,{backgroundColor:session==="success"?colors.tealSoft:session==="error"?colors.surfaceSoft:colors.primarySoft}]}>{busy?<ActivityIndicator size="large" color={colors.primary}/>:<Ionicons name={session==="success"?"checkmark-circle":session==="error"?"alert-circle":"scale-outline"} size={36} color={session==="success"?colors.teal:session==="error"?colors.danger:colors.primary}/>}</View>
 {weight!=null?<Pressable onPress={()=>{if(session==="success"){const next=debugTaps+1;setDebugTaps(next);if(next>=10){setDebugOpen(true);setDebugTaps(0);appendLog("已由隱藏入口開啟診斷記錄");}}}} style={s.weightLine} accessibilityLabel={t("weight")}><Text style={s.weight}>{weight.toFixed(1)}</Text><Text style={s.unit}>kg</Text></Pressable>:null}
 <Text style={s.status}>{session==="success"?t("complete"):session==="error"?t("scaleNotFound"):busy?t("pleaseStepOn"):t("ready")}</Text>
 <Text style={s.message}>{message}</Text>
 <Pressable style={[s.button,busy&&s.cancel]} onPress={()=>void start()}><Ionicons name={busy?"close":session==="success"?"refresh":"scale-outline"} size={19} color="#fff"/><Text style={s.buttonText}>{busy?t("stop"):session==="success"?t("retry"):session==="error"?t("tryAgain"):t("pleaseStepOn")}</Text></Pressable>
 </View></View><Modal visible={debugOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setDebugOpen(false)}><View style={s.debugScreen}><View style={s.debugHeader}><Text style={s.debugTitle}>{t("diagnosticLog")}</Text><Pressable onPress={()=>setDebugOpen(false)} accessibilityRole="button" accessibilityLabel={t("close")} style={s.debugClose}><Ionicons name="close" size={25} color={colors.ink}/></Pressable></View><Text style={s.debugHint}>{t("diagnosticHint")}</Text><ScrollView style={s.debugScroll} contentContainerStyle={{paddingBottom:28}}>{debugLogs.length?debugLogs.map((line,i)=><Text selectable key={i} style={s.debugText}>{line}</Text>):<Text style={s.debugText}>{t("noDiagnosticData")}</Text>}</ScrollView><Pressable style={s.debugDone} onPress={()=>setDebugOpen(false)}><Text style={s.debugDoneText}>{t("close")}</Text></Pressable></View></Modal></SafeAreaView>;
}
function makeStyles(colors:Palette){return StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},content:{flex:1,padding:spacing.md,gap:20},back:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",minHeight:48,paddingVertical:10,paddingHorizontal:4,gap:3},backText:{color:colors.ink,fontSize:13,fontWeight:"700"},header:{gap:8,paddingTop:6},title:{color:colors.ink,fontSize:31,fontWeight:"800",letterSpacing:-.8},subtitle:{color:colors.secondary,fontSize:14,lineHeight:21},card:{alignItems:"center",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radii.lg,padding:24,gap:15},icon:{width:82,height:82,borderRadius:28,alignItems:"center",justifyContent:"center"},weightLine:{flexDirection:"row",alignItems:"baseline",gap:7,marginTop:4},weight:{color:colors.ink,fontSize:60,lineHeight:68,fontWeight:"800",letterSpacing:-2},unit:{color:colors.secondary,fontSize:18,fontWeight:"700"},status:{color:colors.ink,fontSize:20,fontWeight:"800",textAlign:"center"},message:{color:colors.secondary,fontSize:13,lineHeight:20,textAlign:"center"},button:{width:"100%",backgroundColor:colors.primary,borderRadius:15,paddingVertical:15,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,marginTop:7},cancel:{backgroundColor:colors.danger},buttonText:{color:"#fff",fontSize:14,fontWeight:"800"},debugScreen:{flex:1,backgroundColor:colors.canvas,padding:spacing.md,paddingTop:spacing.lg,gap:12},debugHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},debugTitle:{fontSize:21,fontWeight:"800",color:colors.ink},debugClose:{width:40,height:40,borderRadius:20,alignItems:"center",justifyContent:"center",backgroundColor:colors.surfaceSoft},debugHint:{color:colors.secondary,fontSize:12,lineHeight:18},debugScroll:{flex:1,borderRadius:12,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,padding:10},debugText:{fontFamily:Platform.OS==="ios"?"Menlo":"monospace",fontSize:11,lineHeight:16,color:colors.ink,marginBottom:12},debugDone:{backgroundColor:colors.primary,borderRadius:13,padding:13,alignItems:"center"},debugDoneText:{color:"#fff",fontWeight:"800",fontSize:14}});}
