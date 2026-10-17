import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "@/data/database";
import { AppPreferencesProvider, useAppPreferences } from "@/providers/AppPreferences";

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
