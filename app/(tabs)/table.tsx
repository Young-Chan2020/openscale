import {useCallback,useState} from "react";
import {useFocusEffect,useRouter} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Alert,Pressable,StyleSheet,Text,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Page,Panel} from "@/components/Page";
import {deleteMeasurement,listMeasurements} from "@/data/database";
import type {Measurement} from "@/domain/measurement";
import {formatWeight} from "@/domain/measurement";
import {useAppPreferences} from "@/providers/AppPreferences";
export default function HistoryScreen(){
 const db=useSQLiteContext(),router=useRouter();const {colors,t,language}=useAppPreferences();const [items,setItems]=useState<Measurement[]>([]);
 const load=useCallback(async()=>setItems(await listMeasurements(db)),[db]);useFocusEffect(useCallback(()=>{void load();},[load]));
 const add=()=>Alert.alert(t("addFirstMeasurement"),undefined,[{text:t("cancel"),style:"cancel"},{text:t("manualEntry"),onPress:()=>router.push("/measurement/new")},{text:t("startWeighing"),onPress:()=>router.push("/measurement/auto")}]);
 const remove=(id:number)=>Alert.alert(t("deleteRecordTitle"),t("deleteRecordMessage"),[{text:t("keep"),style:"cancel"},{text:t("delete"),style:"destructive",onPress:()=>{void deleteMeasurement(db,id).then(load);}}]);
 const locale=language==="en"?"en-US":language==="zh-Hans"?"zh-CN":"zh-TW";
 const s=StyleSheet.create({add:{backgroundColor:colors.primary,borderRadius:14,width:42,height:42,alignItems:"center",justifyContent:"center"},empty:{alignItems:"center",padding:25,gap:8},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},row:{flexDirection:"row",alignItems:"center",gap:11,paddingVertical:13,borderBottomWidth:1,borderBottomColor:colors.border},icon:{width:36,height:36,borderRadius:13,backgroundColor:colors.primarySoft,alignItems:"center",justifyContent:"center"},meta:{flex:1,gap:4},date:{color:colors.ink,fontSize:13,fontWeight:"700"},right:{alignItems:"flex-end",gap:7},weight:{color:colors.ink,fontSize:15,fontWeight:"800"},unit:{color:colors.secondary,fontSize:11}});
 return <Page title={t("records")} subtitle={t("recordsSubtitle")} right={<Pressable accessibilityRole="button" accessibilityLabel={t("startWeighing")} style={s.add} onPress={add}><Ionicons name="add" size={22} color="#fff"/></Pressable>}><Panel eyebrow={`${items.length} ${t("measurementsCount")}`} title={t("allMeasurements")}>{items.length===0?<View style={s.empty}><Ionicons name="time-outline" size={26} color={colors.muted}/><Text style={s.title}>{t("noRecords")}</Text><Text style={s.sub}>{t("addFirstMeasurement")}</Text></View>:items.map(x=><View key={x.id} style={s.row}><View style={s.icon}><Ionicons name="scale-outline" size={17} color={colors.primary}/></View><View style={s.meta}><Text style={s.date}>{new Date(x.timestamp).toLocaleDateString(locale,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</Text><Text style={s.sub}>{new Date(x.timestamp).toLocaleTimeString(locale,{hour:"numeric",minute:"2-digit"})}</Text></View><View style={s.right}><Text style={s.weight}>{formatWeight(x.weightKg)} <Text style={s.unit}>kg</Text></Text><Pressable accessibilityLabel={t("deleteMeasurement")} onPress={()=>remove(x.id)} hitSlop={8}><Ionicons name="trash-outline" size={17} color={colors.muted}/></Pressable></View></View>)}</Panel></Page>;
}
