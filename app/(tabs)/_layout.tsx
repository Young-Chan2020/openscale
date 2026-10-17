import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppPreferences } from "@/providers/AppPreferences";
export default function TabLayout(){
 const {colors,t}=useAppPreferences();
 const icons:Record<string,keyof typeof Ionicons.glyphMap>={index:"home-outline",graph:"analytics-outline",table:"list-outline",insights:"bulb-outline",settings:"settings-outline"};
 return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,height:66,paddingTop:8,paddingBottom:8},tabBarLabelStyle:{fontSize:11,fontWeight:"600"},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]??"ellipse-outline"} size={size} color={color}/>})}>
 <Tabs.Screen name="index" options={{title:t("overview")}}/><Tabs.Screen name="graph" options={{title:t("charts")}}/><Tabs.Screen name="table" options={{title:t("records")}}/><Tabs.Screen name="insights" options={{title:t("analysis")}}/><Tabs.Screen name="settings" options={{title:t("settings")}}/><Tabs.Screen name="devices" options={{href:null}}/>
 </Tabs>;
}
