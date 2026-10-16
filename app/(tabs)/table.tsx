import {useCallback,useState} from "react";
import {useFocusEffect,useRouter} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Alert,Pressable,StyleSheet,Text,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Page,Panel} from "@/components/Page";
import {deleteMeasurement,listMeasurements} from "@/data/database";
import type {Measurement} from "@/domain/measurement";
import {formatWeight} from "@/domain/measurement";
import {colors} from "@/theme";
export default function HistoryScreen(){
 const db=useSQLiteContext(),router=useRouter();const [items,setItems]=useState<Measurement[]>([]);
 const load=useCallback(async()=>setItems(await listMeasurements(db)),[db]);useFocusEffect(useCallback(()=>{void load();},[load]));
 const remove=(id:number)=>Alert.alert("要刪除這筆測量嗎？","這筆紀錄將會從此裝置永久刪除。",[{text:"保留",style:"cancel"},{text:"刪除",style:"destructive",onPress:()=>{void deleteMeasurement(db,id).then(load);}}]);
 return <Page title="測量紀錄" subtitle="依時間由新到舊顯示測量紀錄。" right={<Pressable style={s.add} onPress={()=>router.push("/measurement/new")}><Ionicons name="add" size={20} color="#fff"/></Pressable>}><Panel eyebrow={`${items.length} 筆紀錄`} title="所有測量">{items.length===0?<View style={s.empty}><Ionicons name="time-outline" size={26} color={colors.muted}/><Text style={s.title}>尚無測量紀錄</Text><Text style={s.sub}>新增第一筆測量，開始建立個人紀錄。</Text></View>:items.map(x=><View key={x.id} style={s.row}><View style={s.icon}><Ionicons name="scale-outline" size={17} color={colors.primary}/></View><View style={s.meta}><Text style={s.date}>{new Date(x.timestamp).toLocaleDateString("zh-TW",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</Text><Text style={s.sub}>{new Date(x.timestamp).toLocaleTimeString("zh-TW",{hour:"numeric",minute:"2-digit"})}{x.note?` · ${x.note}`:""}</Text></View><View style={s.right}><Text style={s.weight}>{formatWeight(x.weightKg)} <Text style={s.unit}>kg</Text></Text><Pressable accessibilityLabel="刪除測量" onPress={()=>remove(x.id)} hitSlop={8}><Ionicons name="trash-outline" size={17} color={colors.muted}/></Pressable></View></View>)}</Panel></Page>;
}
const s=StyleSheet.create({add:{backgroundColor:colors.primary,borderRadius:14,width:42,height:42,alignItems:"center",justifyContent:"center"},empty:{alignItems:"center",padding:25,gap:8},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},row:{flexDirection:"row",alignItems:"center",gap:11,paddingVertical:13,borderBottomWidth:1,borderBottomColor:colors.border},icon:{width:36,height:36,borderRadius:13,backgroundColor:colors.primarySoft,alignItems:"center",justifyContent:"center"},meta:{flex:1,gap:4},date:{color:colors.ink,fontSize:13,fontWeight:"700"},right:{alignItems:"flex-end",gap:7},weight:{color:colors.ink,fontSize:15,fontWeight:"800"},unit:{color:colors.secondary,fontSize:11}});