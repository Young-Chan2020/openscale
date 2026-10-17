import {useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,PermissionsAndroid,Platform,Pressable,StyleSheet,Text,View} from "react-native";
import {useRouter} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Ionicons} from "@expo/vector-icons";
import type {Device,BleError,Subscription} from "react-native-ble-plx";
import {SafeAreaView} from "react-native-safe-area-context";
import {addMeasurement} from "@/data/database";
import {getBleManager} from "@/bluetooth/manager";
import {WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID,WEIGHT_SCALE_SERVICE_UUID,parseWeightMeasurementBase64,standardWeightScaleAdapter} from "@/bluetooth/protocols/standardWeightScale";
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
 const [session,setSession]=useState<SessionState>("ready"),[weight,setWeight]=useState<number|null>(null),[message,setMessage]=useState(t("startPrompt"));
 const managerRef=useRef<ReturnType<typeof getBleManager>>(null),deviceRef=useRef<Device|null>(null),monitorRef=useRef<Subscription|null>(null),timeoutRef=useRef<ReturnType<typeof setTimeout>|null>(null),activeRef=useRef(false),savedRef=useRef(false),candidateHandledRef=useRef(false);
 const cleanup=useCallback(async()=>{activeRef.current=false;candidateHandledRef.current=false;if(timeoutRef.current){clearTimeout(timeoutRef.current);timeoutRef.current=null;}monitorRef.current?.remove();monitorRef.current=null;managerRef.current?.stopDeviceScan();const device=deviceRef.current;deviceRef.current=null;if(device){try{await device.cancelConnection();}catch{}}},[]);
 useEffect(()=>()=>{void cleanup();},[cleanup]);
 const fail=useCallback((title:string)=>{if(!activeRef.current)return;void cleanup();setSession("error");setMessage(title);},[cleanup]);
 const start=async()=>{
  if(["scanning","connecting","waiting"].includes(session)){await cleanup();setSession("ready");setMessage(t("startPrompt"));return;}
  const manager=getBleManager();if(!manager){setSession("error");setMessage(t("readFailed"));return;}
  setWeight(null);savedRef.current=false;candidateHandledRef.current=false;managerRef.current=manager;
  try{
   if(!await requestBlePermissions()){setSession("error");setMessage(t("bluetoothPermissionMessage"));return;}
   if(await manager.state()!=="PoweredOn"){setSession("error");setMessage(t("bluetoothOff"));return;}
   activeRef.current=true;setSession("scanning");setMessage(t("pleaseStepOn"));
   timeoutRef.current=setTimeout(()=>{if(activeRef.current)fail(t("scaleNotFound"));},45000);
   manager.startDeviceScan(null,{allowDuplicates:true},async(error:BleError|null,device:Device|null)=>{
    if(!activeRef.current)return;if(error){fail(t("readFailed"));return;}if(!device||candidateHandledRef.current)return;
    const broadcast=device.manufacturerData?parseOkOkBroadcast(device.manufacturerData,device.name,device.localName):null;
    if(broadcast){candidateHandledRef.current=true;manager.stopDeviceScan();savedRef.current=true;try{await addMeasurement(db,{weightKg:broadcast.weightKg,timestamp:Date.now(),note:null});if(!activeRef.current)return;setWeight(broadcast.weightKg);setSession("success");setMessage(t("savedReading"));await cleanup();}catch{savedRef.current=false;fail(t("saveFailed"));}return;}
    if(!standardWeightScaleAdapter.matchesAdvertisement({serviceUUIDs:device.serviceUUIDs??[],manufacturerData:device.manufacturerData,name:device.name,localName:device.localName}))return;
    candidateHandledRef.current=true;manager.stopDeviceScan();setSession("connecting");setMessage(t("connecting"));
    try{
     const connected=await manager.connectToDevice(device.id,{timeout:12000});if(!activeRef.current){try{await connected.cancelConnection();}catch{}return;}deviceRef.current=connected;
     const discovered=await connected.discoverAllServicesAndCharacteristics();const services=await discovered.services();
     if(!services.some(s=>s.uuid.toLowerCase()===WEIGHT_SCALE_SERVICE_UUID)){fail(t("readFailed"));return;}
     const chars=await discovered.characteristicsForService(WEIGHT_SCALE_SERVICE_UUID);
     if(!chars.some(c=>c.uuid.toLowerCase()===WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID&&c.isNotifiable)){fail(t("readFailed"));return;}
     setSession("waiting");setMessage(t("pleaseStepOn"));
     monitorRef.current=discovered.monitorCharacteristicForService(WEIGHT_SCALE_SERVICE_UUID,WEIGHT_MEASUREMENT_CHARACTERISTIC_UUID,async(monitorError,characteristic)=>{
      if(!activeRef.current||savedRef.current)return;if(monitorError){fail(t("readFailed"));return;}const parsed=characteristic?.value?parseWeightMeasurementBase64(characteristic.value):null;if(parsed==null)return;
      savedRef.current=true;try{await addMeasurement(db,{weightKg:parsed,timestamp:Date.now(),note:null});if(!activeRef.current)return;setWeight(parsed);setSession("success");setMessage(t("savedReading"));await cleanup();}catch{savedRef.current=false;fail(t("saveFailed"));}
     });
    }catch{fail(t("scaleNotFound"));}
   });
  }catch{await cleanup();setSession("error");setMessage(t("tryAgainMessage"));}
 };
 const busy=["scanning","connecting","waiting"].includes(session);
 const s=makeStyles(colors);
 return <SafeAreaView style={s.safe} edges={["bottom"]}><View style={s.content}>
 <Pressable style={s.back} onPress={()=>router.back()} accessibilityRole="button"><Ionicons name="chevron-back" size={21} color={colors.ink}/><Text style={s.backText}>{t("back")}</Text></Pressable>
 <View style={s.header}><Text style={s.title}>{t("startWeighing")}</Text><Text style={s.subtitle}>{session==="success"?t("savedReading"):busy?t("pleaseStepOn"):session==="error"?message:t("startPrompt")}</Text></View>
 <View style={s.card}><View style={[s.icon,{backgroundColor:session==="success"?colors.tealSoft:session==="error"?colors.surfaceSoft:colors.primarySoft}]}>{busy?<ActivityIndicator size="large" color={colors.primary}/>:<Ionicons name={session==="success"?"checkmark-circle":session==="error"?"alert-circle":"scale-outline"} size={36} color={session==="success"?colors.teal:session==="error"?colors.danger:colors.primary}/>}</View>
 {weight!=null?<View style={s.weightLine}><Text style={s.weight}>{weight.toFixed(1)}</Text><Text style={s.unit}>kg</Text></View>:null}
 <Text style={s.status}>{session==="success"?t("complete"):session==="error"?t("scaleNotFound"):busy?t("pleaseStepOn"):t("ready")}</Text>
 <Text style={s.message}>{message}</Text>
 <Pressable style={[s.button,busy&&s.cancel]} onPress={()=>void start()}><Ionicons name={busy?"close":session==="success"?"refresh":"scale-outline"} size={19} color="#fff"/><Text style={s.buttonText}>{busy?t("stop"):session==="success"?t("retry"):session==="error"?t("tryAgain"):t("pleaseStepOn")}</Text></Pressable>
 </View></View></SafeAreaView>;
}
function makeStyles(colors:Palette){return StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},content:{flex:1,padding:spacing.md,gap:20},back:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",paddingVertical:4,gap:3},backText:{color:colors.ink,fontSize:13,fontWeight:"700"},header:{gap:8,paddingTop:6},title:{color:colors.ink,fontSize:31,fontWeight:"800",letterSpacing:-.8},subtitle:{color:colors.secondary,fontSize:14,lineHeight:21},card:{alignItems:"center",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radii.lg,padding:24,gap:15},icon:{width:82,height:82,borderRadius:28,alignItems:"center",justifyContent:"center"},weightLine:{flexDirection:"row",alignItems:"baseline",gap:7,marginTop:4},weight:{color:colors.ink,fontSize:60,lineHeight:68,fontWeight:"800",letterSpacing:-2},unit:{color:colors.secondary,fontSize:18,fontWeight:"700"},status:{color:colors.ink,fontSize:20,fontWeight:"800",textAlign:"center"},message:{color:colors.secondary,fontSize:13,lineHeight:20,textAlign:"center"},button:{width:"100%",backgroundColor:colors.primary,borderRadius:15,paddingVertical:15,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,marginTop:7},cancel:{backgroundColor:colors.danger},buttonText:{color:"#fff",fontSize:14,fontWeight:"800"}});}
