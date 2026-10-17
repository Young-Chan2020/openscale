export type Palette = {canvas:string;surface:string;surfaceSoft:string;ink:string;secondary:string;muted:string;border:string;primary:string;primarySoft:string;teal:string;tealSoft:string;amber:string;amberSoft:string;danger:string;chart:string};
const light:Palette={canvas:"#F5F6F8",surface:"#FFFFFF",surfaceSoft:"#F0F3F7",ink:"#17212F",secondary:"#5E6B7B",muted:"#8A95A3",border:"#E3E8EF",primary:"#315FCE",primarySoft:"#E8EEFF",teal:"#167D79",tealSoft:"#E4F5F2",amber:"#9A6513",amberSoft:"#FFF3D9",danger:"#B94A48",chart:"#4B70D6"};
const dark:Palette={canvas:"#10141C",surface:"#191F2A",surfaceSoft:"#232B38",ink:"#F2F5FA",secondary:"#B1BBCB",muted:"#8793A5",border:"#303A4A",primary:"#8CAEFF",primarySoft:"#26385D",teal:"#64C9B9",tealSoft:"#203D3A",amber:"#F0C36D",amberSoft:"#42351E",danger:"#FF8A86",chart:"#8CAEFF"};
export function colorsFor(mode:"light"|"dark"):Palette{return mode==="dark"?dark:light;}
export const colors=light;
export const radii={sm:12,md:18,lg:26};
export const spacing={sm:10,md:16,lg:22};
