import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppPreferences } from "@/providers/AppPreferences";
export default function TabLayout(){
 const {colors,t}=useAppPreferences();
 const insets=useSafeAreaInsets();
 const icons:Record<string,keyof typeof Ionicons.glyphMap>={index:"home-outline",graph:"analytics-outline",table:"list-outline",insights:"bulb-outline",settings:"settings-outline"};
 // Keep the tab controls above the iPhone home indicator and Android system navigation area.
 const bottomInset=Math.max(insets.bottom,Platform.OS==="android"?8:0);
 const barContentHeight=58;
 return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,tabBarHideOnKeyboard:true,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,height:barContentHeight+bottomInset,paddingTop:6,paddingBottom:bottomInset+4},tabBarItemStyle:{minWidth:0,paddingHorizontal:0},tabBarLabelStyle:{fontSize:10,lineHeight:13,fontWeight:"600",flexShrink:1,textAlign:"center"},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]??"ellipse-outline"} size={size} color={color}/>})}>
 <Tabs.Screen name="index" options={{title:t("overview")}}/><Tabs.Screen name="graph" options={{title:t("charts")}}/><Tabs.Screen name="table" options={{title:t("records")}}/><Tabs.Screen name="insights" options={{title:t("analysis")}}/><Tabs.Screen name="settings" options={{title:t("settings")}}/>
 </Tabs>;
}
