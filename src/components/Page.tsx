import type {ReactNode} from "react";
import {ScrollView,StyleSheet,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useAppPreferences} from "@/providers/AppPreferences";
import {spacing} from "@/theme";
export function Page({title,subtitle,children,right}:{title:string;subtitle?:string;children:ReactNode;right?:ReactNode}){
 const {colors}=useAppPreferences();
 const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},scroll:{paddingBottom:28},content:{padding:spacing.md,gap:spacing.md},header:{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",gap:12},title:{color:colors.ink,fontSize:29,lineHeight:35,fontWeight:"800",letterSpacing:-.7},subtitle:{color:colors.secondary,fontSize:13,lineHeight:19},panel:{backgroundColor:colors.surface,borderRadius:22,borderWidth:1,borderColor:colors.border,padding:spacing.md,gap:12},panelTitle:{color:colors.ink,fontSize:17,fontWeight:"700"}});
 return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.scroll}><View style={s.content}>
 <View style={s.header}><View style={{flex:1,gap:4}}><Text style={s.title}>{title}</Text>{subtitle?<Text style={s.subtitle}>{subtitle}</Text>:null}</View>{right}</View>{children}
 </View></ScrollView></SafeAreaView>;
}
export function Panel({title,eyebrow,children}:{title?:string;eyebrow?:string;children:ReactNode}){
 const {colors}=useAppPreferences();
 return <View style={{backgroundColor:colors.surface,borderRadius:22,borderWidth:1,borderColor:colors.border,padding:spacing.md,gap:12}}>{eyebrow?<Text style={{color:colors.primary,fontSize:10,fontWeight:"800",letterSpacing:1.1}}>{eyebrow}</Text>:null}{title?<Text style={{color:colors.ink,fontSize:17,fontWeight:"700"}}>{title}</Text>:null}{children}</View>;
}
