import {useCallback,useMemo,useState} from "react";
import {useFocusEffect} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Ionicons} from "@expo/vector-icons";
import {StyleSheet,Text,View} from "react-native";
import {Page,Panel} from "@/components/Page";
import {listMeasurements} from "@/data/database";
import type {Measurement} from "@/domain/measurement";
import {calculateWeightDifference} from "@/domain/calculations";
import {colors,radii} from "@/theme";
export default function InsightsScreen(){
 const db=useSQLiteContext();const [items,setItems]=useState<Measurement[]>([]);const load=useCallback(async()=>setItems(await listMeasurements(db)),[db]);useFocusEffect(useCallback(()=>{void load();},[load]));
 const a=items[0],b=items[1],delta=useMemo(()=>a?.weightKg!=null&&b?.weightKg!=null?calculateWeightDifference(a.weightKg,b.weightKg):null,[a?.weightKg,b?.weightKg]);
 return <Page title="數據分析" subtitle="從自己的測量數據了解變化。"><Panel eyebrow="最近一次比較" title="體重變化">{delta==null?<View style={s.empty}><View style={s.icon}><Ionicons name="bulb-outline" size={24} color={colors.amber}/></View><Text style={s.title}>累積更多數據，掌握更多趨勢</Text><Text style={s.sub}>新增至少兩筆測量，即可查看比較結果。</Text></View>:<View style={s.delta}><Text style={s.value}>{delta>0?"+":""}{delta.toFixed(1)} kg</Text><Text style={s.sub}>與上一筆體重紀錄相比。</Text></View>}</Panel><Panel title="關於身體指標" eyebrow="說明"><Text style={s.sub}>BMI 與其他衍生指標需要個人資料及原版計算規則；完成驗證前，不會在缺少必要資料時猜測數值。</Text></Panel><View style={s.notice}><Ionicons name="information-circle-outline" size={18} color={colors.primary}/><Text style={s.sub}>分析內容僅供參考，不能取代醫療診斷。</Text></View></Page>;
}
const s=StyleSheet.create({empty:{alignItems:"center",paddingVertical:22,gap:8},icon:{width:48,height:48,borderRadius:17,backgroundColor:colors.amberSoft,alignItems:"center",justifyContent:"center"},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},delta:{backgroundColor:colors.tealSoft,borderRadius:radii.md,padding:17,gap:6},value:{color:colors.teal,fontSize:30,fontWeight:"800"},notice:{flexDirection:"row",gap:9,alignItems:"center",backgroundColor:colors.primarySoft,padding:13,borderRadius:14}});