import {useCallback,useMemo,useState} from "react";
import {useFocusEffect} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {Ionicons} from "@expo/vector-icons";
import {StyleSheet,Text,View} from "react-native";
import {Page,Panel} from "@/components/Page";
import {getUserProfile,listMeasurements} from "@/data/database";
import type {Measurement,MetricValue} from "@/domain/measurement";
import {calculateBmi,calculateWeightDifference,classifyBmi} from "@/domain/calculations";
import {useAppPreferences} from "@/providers/AppPreferences";
function findMetric(values:MetricValue[],keys:string[]){return values.find(v=>keys.includes(v.key.toLowerCase().replace(/[^a-z0-9]/g,""))&&typeof v.value==="number");}
export default function InsightsScreen(){
 const db=useSQLiteContext();const {colors,t}=useAppPreferences();const [items,setItems]=useState<Measurement[]>([]);const [profile,setProfile]=useState<{height_cm:number|null;birth_year:number|null;sex:"female"|"male"|"unspecified"}|null>(null);
 const load=useCallback(async()=>{const [measurements,p]=await Promise.all([listMeasurements(db),getUserProfile(db)]);setItems(measurements);setProfile(p?{height_cm:p.height_cm,birth_year:p.birth_year,sex:p.sex}:null);},[db]);useFocusEffect(useCallback(()=>{void load();},[load]));
 const a=items[0],b=items[1],delta=useMemo(()=>a?.weightKg!=null&&b?.weightKg!=null?calculateWeightDifference(a.weightKg,b.weightKg):null,[a?.weightKg,b?.weightKg]);
 const scaleBmi=a?findMetric(a.values,["bmi","bodymassindex"]):undefined;
 const bmi=a?.weightKg!=null&&profile?.height_cm!=null?calculateBmi(a.weightKg,profile.height_cm):(scaleBmi&&typeof scaleBmi.value==="number"?scaleBmi.value:null);
 const age=profile?.birth_year?new Date().getFullYear()-profile.birth_year:null;
 const bmr=a?.weightKg!=null&&profile?.height_cm!=null&&age!=null&&age>=18&&age<=120&&profile.sex!=="unspecified"?Math.round(10*a.weightKg+6.25*profile.height_cm-5*age+(profile.sex==="male"?5:-161)):null;
 const bodyFat=a?findMetric(a.values,["bodyfat","bodyfatpercentage","fatpercentage","fatpercent"]):undefined;
 const muscle=a?findMetric(a.values,["musclemass","muscle","skeletalmuscle","skeletalmusclemass"]):undefined;
 const visceral=a?findMetric(a.values,["visceralfat","visceralfatlevel","visceralfatrating"]):undefined;
 const s=StyleSheet.create({empty:{alignItems:"center",paddingVertical:22,gap:8},icon:{width:48,height:48,borderRadius:17,backgroundColor:colors.amberSoft,alignItems:"center",justifyContent:"center"},title:{color:colors.ink,fontSize:15,fontWeight:"700"},sub:{color:colors.secondary,fontSize:12,lineHeight:18},delta:{backgroundColor:colors.tealSoft,borderRadius:18,padding:17,gap:6},value:{color:colors.teal,fontSize:30,fontWeight:"800"},bmiBox:{backgroundColor:colors.primarySoft,borderRadius:18,padding:18,gap:8},bmiValue:{fontSize:42,fontWeight:"800",color:colors.ink},category:{color:colors.primary,fontSize:14,fontWeight:"800"},metricRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},metricName:{color:colors.secondary,fontSize:13},metricValue:{color:colors.ink,fontSize:16,fontWeight:"800"},notice:{flexDirection:"row",gap:9,alignItems:"flex-start",backgroundColor:colors.surfaceSoft,padding:13,borderRadius:14}});
 return <Page title={t("analysis")} subtitle={t("analysisSubtitle")}><Panel eyebrow={t("recentComparison")} title={t("weightChange")}>{delta==null?<View style={s.empty}><View style={s.icon}><Ionicons name="trending-up-outline" size={24} color={colors.amber}/></View><Text style={s.title}>{t("noComparison")}</Text><Text style={s.sub}>{t("needTwoForComparison")}</Text></View>:<View style={s.delta}><Text style={s.value}>{delta>0?"+":""}{delta.toFixed(1)} kg</Text><Text style={s.sub}>{t("comparedPrevious")}</Text></View>}</Panel>
 <Panel title={t("bmi")} eyebrow={t("bodyIndicators")}>{bmi==null?<View style={s.empty}><Text style={s.sub}>{t("bmiNeedHeight")}</Text></View>:<View style={s.bmiBox}><Text style={s.bmiValue}>{bmi.toFixed(1)}</Text><Text style={s.category}>{t(classifyBmi(bmi)==="Underweight"?"underweight":classifyBmi(bmi)==="Normal range"?"normal":classifyBmi(bmi)==="Overweight"?"overweight":"obesity")}</Text><Text style={s.sub}>{t("height")}: {profile?.height_cm} cm · {t("weight")}: {a?.weightKg?.toFixed(1)} kg</Text></View>}<Text style={s.sub}>{t("bmiDescription")}</Text></Panel>
 <Panel title={t("bmr")} eyebrow={t("bodyIndicators")}>{bmr==null?<Text style={s.sub}>{t("bmrNeedProfile")}</Text>:<><Text style={s.bmiValue}>{bmr} <Text style={s.metricName}>kcal/day</Text></Text><Text style={s.sub}>{t("bmrNeedProfile")}</Text></>}</Panel>
 <Panel title={t("bodyIndicators")}><View style={s.metricRow}><Text style={s.metricName}>{t("bodyFat")}</Text><Text style={s.metricValue}>{bodyFat?String(bodyFat.value)+" "+bodyFat.unit:"—"}</Text></View><View style={s.metricRow}><Text style={s.metricName}>{t("muscleMass")}</Text><Text style={s.metricValue}>{muscle?String(muscle.value)+" "+muscle.unit:"—"}</Text></View><View style={s.metricRow}><Text style={s.metricName}>{t("visceralFat")}</Text><Text style={s.metricValue}>{visceral?String(visceral.value)+" "+visceral.unit:"—"}</Text></View>{!bodyFat&&!muscle&&!visceral?<Text style={[s.sub,{marginTop:10}]}>{t("notProvidedByScale")}</Text>:null}</Panel>
 <View style={s.notice}><Ionicons name="information-circle-outline" size={18} color={colors.primary}/><Text style={[s.sub,{flex:1}]}>{t("healthDisclaimer")}</Text></View></Page>;
}
