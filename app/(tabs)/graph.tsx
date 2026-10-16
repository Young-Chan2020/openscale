import {useCallback,useMemo,useState} from "react";
import {useFocusEffect} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {StyleSheet,Text,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Page,Panel} from "@/components/Page";
import {listMeasurements} from "@/data/database";
import type {Measurement} from "@/domain/measurement";
import {weeklyWeightTrend} from "@/domain/calculations";
import {colors,radii} from "@/theme";
export default function GraphScreen(){
 const db=useSQLiteContext();const [items,setItems]=useState<Measurement[]>([]);const load=useCallback(async()=>setItems(await listMeasurements(db)),[db]);useFocusEffect(useCallback(()=>{void load();},[load]));
 const points=useMemo(()=>weeklyWeightTrend(items).slice(-12),[items]);const min=points.length?Math.min(...points.map(p=>p.weightKg)):0;const max=points.length?Math.max(...points.map(p=>p.weightKg)):0;const range=Math.max(max-min,1);
 return <Page title="圖表" subtitle="查看測量數據隨時間的變化。"><Panel title="體重趨勢" eyebrow="測量數據">{points.length<2?<View style={s.empty}><View style={s.icon}><Ionicons name="analytics-outline" size={25} color={colors.primary}/></View><Text style={s.title}>你的趨勢圖會顯示在這裡</Text><Text style={s.sub}>至少新增兩筆體重紀錄，才能比較變化。</Text></View>:<><View style={s.chart}>{points.map((p,i)=><View key={`${p.label}-${i}`} style={s.group}><Text style={s.value}>{p.weightKg.toFixed(1)}</Text><View style={s.track}><View style={[s.bar,{height:`${Math.max(12,((p.weightKg-min)/range)*100)}%`}]}/></View><Text style={s.label}>{p.label}</Text></View>)}</View><Text style={s.caption}>圖表僅顯示實際儲存的測量資料；篩選器與進階圖層仍待移植。</Text></>}</Panel><Panel title="圖表功能移植進度" eyebrow="後續工作"><Text style={s.sub}>原版還包含篩選、圖層、期間選擇、圖表設定與比較功能，仍在移植清單中。</Text></Panel></Page>;
}
const s=StyleSheet.create({empty:{alignItems:"center",paddingVertical:24,paddingHorizontal:12,gap:8},icon:{width:50,height:50,borderRadius:17,backgroundColor:colors.primarySoft,alignItems:"center",justifyContent:"center"},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},chart:{flexDirection:"row",alignItems:"flex-end",height:205,gap:8,paddingTop:18},group:{flex:1,alignItems:"center",justifyContent:"flex-end",height:"100%",gap:7},value:{color:colors.secondary,fontSize:9,fontWeight:"700"},track:{width:"70%",flex:1,justifyContent:"flex-end",backgroundColor:colors.surfaceSoft,borderRadius:radii.sm,overflow:"hidden"},bar:{backgroundColor:colors.chart,borderRadius:radii.sm,minHeight:6,width:"100%"},label:{color:colors.muted,fontSize:9},caption:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:12}});