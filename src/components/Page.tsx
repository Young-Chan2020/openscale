import type {ReactNode} from "react";
import {ScrollView,StyleSheet,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {colors,spacing} from "@/theme";
export function Page({title,subtitle,children,right}:{title:string;subtitle?:string;children:ReactNode;right?:ReactNode}){
 return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.scroll}><View style={s.content}>
 <View style={s.header}><View style={{flex:1,gap:4}}><Text style={s.eyebrow}>OPEN SCALE</Text><Text style={s.title}>{title}</Text>{subtitle?<Text style={s.subtitle}>{subtitle}</Text>:null}</View>{right}</View>{children}
 </View></ScrollView></SafeAreaView>;
}
export function Panel({title,eyebrow,children}:{title?:string;eyebrow?:string;children:ReactNode}){
 return <View style={s.panel}>{eyebrow?<Text style={s.eyebrow}>{eyebrow}</Text>:null}{title?<Text style={s.panelTitle}>{title}</Text>:null}{children}</View>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},scroll:{paddingBottom:28},content:{padding:spacing.md,gap:spacing.md},header:{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",gap:12},eyebrow:{color:colors.primary,fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{color:colors.ink,fontSize:29,lineHeight:35,fontWeight:"800",letterSpacing:-.7},subtitle:{color:colors.secondary,fontSize:13,lineHeight:19},panel:{backgroundColor:colors.surface,borderRadius:22,borderWidth:1,borderColor:colors.border,padding:spacing.md,gap:12},panelTitle:{color:colors.ink,fontSize:17,fontWeight:"700"}});