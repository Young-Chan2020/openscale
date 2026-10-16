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
 return <Page title="Charts" subtitle="See how your measurements change over time."><Panel title="Weight trend" eyebrow="MEASUREMENTS">{points.length<2?<View style={s.empty}><View style={s.icon}><Ionicons name="analytics-outline" size={25} color={colors.primary}/></View><Text style={s.title}>Your trend will appear here</Text><Text style={s.sub}>Record at least two weight measurements to compare your progress.</Text></View>:<><View style={s.chart}>{points.map((p,i)=><View key={`${p.label}-${i}`} style={s.group}><Text style={s.value}>{p.weightKg.toFixed(1)}</Text><View style={s.track}><View style={[s.bar,{height:`${Math.max(12,((p.weightKg-min)/range)*100)}%`}]}/></View><Text style={s.label}>{p.label}</Text></View>)}</View><Text style={s.caption}>Showing actual saved measurements only. Chart filters and advanced layers will be ported in a later pass.</Text></>}</Panel><Panel title="Chart parity" eyebrow="NEXT"><Text style={s.sub}>The master app also includes filters, layers, period selection, chart settings and comparisons. Those interactions remain on the port checklist.</Text></Panel></Page>;
}
const s=StyleSheet.create({empty:{alignItems:"center",paddingVertical:24,paddingHorizontal:12,gap:8},icon:{width:50,height:50,borderRadius:17,backgroundColor:colors.primarySoft,alignItems:"center",justifyContent:"center"},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},chart:{flexDirection:"row",alignItems:"flex-end",height:205,gap:8,paddingTop:18},group:{flex:1,alignItems:"center",justifyContent:"flex-end",height:"100%",gap:7},value:{color:colors.secondary,fontSize:9,fontWeight:"700"},track:{width:"70%",flex:1,justifyContent:"flex-end",backgroundColor:colors.surfaceSoft,borderRadius:radii.sm,overflow:"hidden"},bar:{backgroundColor:colors.chart,borderRadius:radii.sm,minHeight:6,width:"100%"},label:{color:colors.muted,fontSize:9},caption:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:12}});