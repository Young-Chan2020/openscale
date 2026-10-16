import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

const icons:Record<string,keyof typeof Ionicons.glyphMap>={index:"home-outline",graph:"analytics-outline",table:"list-outline",insights:"bulb-outline",settings:"settings-outline"};
export default function TabLayout(){
  return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,height:66,paddingTop:8,paddingBottom:8},tabBarLabelStyle:{fontSize:11,fontWeight:"600"},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]??"ellipse-outline"} size={size} color={color}/>})}>
    <Tabs.Screen name="index" options={{title:"Overview"}}/><Tabs.Screen name="graph" options={{title:"Charts"}}/><Tabs.Screen name="table" options={{title:"History"}}/><Tabs.Screen name="insights" options={{title:"Insights"}}/><Tabs.Screen name="settings" options={{title:"Settings"}}/>
  </Tabs>;
}