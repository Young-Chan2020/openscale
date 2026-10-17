import {useCallback,useMemo,useState} from "react";
import {useFocusEffect} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Ionicons} from "@expo/vector-icons";
import {StyleSheet,Text,View} from "react-native";
import {Page,Panel} from "@/components/Page";
import {getUserProfile,listMeasurements} from "@/data/database";
import type {Measurement} from "@/domain/measurement";
import {calculateBmi,calculateWeightDifference,classifyBmi} from "@/domain/calculations";
import {useAppPreferences} from "@/providers/AppPreferences";
export default function InsightsScreen(){
 const db=useSQLiteContext();const {colors,t,language}=useAppPreferences();const [items,setItems]=useState<Measurement[]>([]);const [height,setHeight]=useState<number|null>(null);
 const load=useCallback(async()=>{const [measurements,profile]=await Promise.all([listMeasurements(db),getUserProfile(db)]);setItems(measurements);setHeight(profile?.height_cm??null);},[db]);useFocusEffect(useCallback(()=>{void load();},[load]));
 const a=items[0],b=items[1],delta=useMemo(()=>a?.weightKg!=null&&b?.weightKg!=null?calculateWeightDifference(a.weightKg,b.weightKg):null,[a?.weightKg,b?.weightKg]);
 const bmi=a?.weightKg!=null&&height!=null?calculateBmi(a.weightKg,height):null;const bmiCategory=bmi==null?null:bmi<18.5?t("underweight"):bmi<25?t("normal"):bmi<30?t("overweight"):t("obesity");
 const s=StyleSheet.create({empty:{alignItems:"center",paddingVertical:22,gap:8},icon:{width:48,height:48,borderRadius:17,backgroundColor:colors.amberSoft,alignItems:"center",justifyContent:"center"},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},delta:{backgroundColor:colors.tealSoft,borderRadius:18,padding:17,gap:6},value:{color:colors.teal,fontSize:30,fontWeight:"800"},bmiBox:{backgroundColor:colors.primarySoft,borderRadius:18,padding:18,gap:8},bmiValue:{fontSize:42,fontWeight:"800",color:colors.ink},category:{color:colors.primary,fontSize:14,fontWeight:"800"},notice:{flexDirection:"row",gap:9,alignItems:"flex-start",backgroundColor:colors.surfaceSoft,padding:13,borderRadius:14}});
 return <Page title={t("analysis")} subtitle={t("analysisSubtitle")}><Panel eyebrow={t("recentComparison")} title={t("weightChange")}>{delta==null?<View style={s.empty}><View style={s.icon}><Ionicons name="trending-up-outline" size={24} color={colors.amber}/></View><Text style={s.title}>{t("noComparison")}</Text><Text style={s.sub}>{t("needTwoForComparison")}</Text></View>:<View style={s.delta}><Text style={s.value}>{delta>0?"+":""}{delta.toFixed(1)} kg</Text><Text style={s.sub}>{t("comparedPrevious")}</Text></View>}</Panel>
 <Panel title={t("bmi")} eyebrow={t("bodyIndicators")}>{bmi==null?<View style={s.empty}><Text style={s.sub}>{t("bmiNeedHeight")}</Text></View>:<View style={s.bmiBox}><Text style={s.bmiValue}>{bmi.toFixed(1)}</Text><Text style={s.category}>{bmiCategory}</Text><Text style={s.sub}>{t("height")}: {height} cm · {t("weight")}: {a?.weightKg?.toFixed(1)} kg</Text></View>}<Text style={s.sub}>{t("bmiDescription")}</Text></Panel>
 <View style={s.notice}><Ionicons name="information-circle-outline" size={18} color={colors.primary}/><Text style={[s.sub,{flex:1}]}>{t("healthDisclaimer")}</Text></View></Page>;
}
