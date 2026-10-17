import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "@/data/database";
import { colors } from "@/theme";

export default function RootLayout() {
  return <SQLiteProvider databaseName="openscale.db" onInit={initDatabase}>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown:false, contentStyle:{backgroundColor:colors.canvas} }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="measurement/auto" />
      <Stack.Screen name="measurement/new" options={{presentation:"modal",headerShown:true,title:"新增測量",headerTintColor:colors.ink,headerStyle:{backgroundColor:colors.canvas}}} />
    </Stack>
  </SQLiteProvider>;
}
