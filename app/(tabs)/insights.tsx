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
 return <Page title="Insights" subtitle="Helpful context from your own data."><Panel eyebrow="LATEST COMPARISON" title="Weight change">{delta==null?<View style={s.empty}><View style={s.icon}><Ionicons name="bulb-outline" size={24} color={colors.amber}/></View><Text style={s.title}>More data, better context</Text><Text style={s.sub}>Record two or more measurements to see a comparison.</Text></View>:<View style={s.delta}><Text style={s.value}>{delta>0?"+":""}{delta.toFixed(1)} kg</Text><Text style={s.sub}>Compared with your previous recorded weight.</Text></View>}</Panel><Panel title="About body metrics" eyebrow="REFERENCE"><Text style={s.sub}>BMI and other derived metrics depend on profile information and the reference app's calculation rules. They will be ported with explicit inputs and tests; this screen will not invent values when profile data is missing.</Text></Panel><View style={s.notice}><Ionicons name="information-circle-outline" size={18} color={colors.primary}/><Text style={s.sub}>Insights are informational and are not a medical diagnosis.</Text></View></Page>;
}
const s=StyleSheet.create({empty:{alignItems:"center",paddingVertical:22,gap:8},icon:{width:48,height:48,borderRadius:17,backgroundColor:colors.amberSoft,alignItems:"center",justifyContent:"center"},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},delta:{backgroundColor:colors.tealSoft,borderRadius:radii.md,padding:17,gap:6},value:{color:colors.teal,fontSize:30,fontWeight:"800"},notice:{flexDirection:"row",gap:9,alignItems:"center",backgroundColor:colors.primarySoft,padding:13,borderRadius:14}});