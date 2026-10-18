import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "@/data/database";
import { AppPreferencesProvider, useAppPreferences } from "@/providers/AppPreferences";

// Avoid an extra fade animation when the native launch screen is dismissed.
// 避免原生啟動畫面退出時再多播放一次淡出動畫。
SplashScreen.setOptions({ fade: false });

function AppStack(){
 const {colors,resolvedTheme}=useAppPreferences();
 return <>
  <StatusBar style={resolvedTheme==="dark"?"light":"dark"} />
  <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.canvas}}}>
   <Stack.Screen name="(tabs)" />
   <Stack.Screen name="measurement/auto" />
   <Stack.Screen name="measurement/new" options={{presentation:"modal"}} />
  </Stack>
 </>;
}
export default function RootLayout(){
 return <SQLiteProvider databaseName="openscale.db" onInit={initDatabase}><AppPreferencesProvider><AppStack/></AppPreferencesProvider></SQLiteProvider>;
}
