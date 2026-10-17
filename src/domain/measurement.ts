export type Measurement={id:number;userId:number;timestamp:number;weightKg:number|null;note:string|null;values:MetricValue[]};
export type MetricValue={key:string;value:number|string;unit:string;source:"scale"|"derived"|"manual"};
export type NewMeasurement={userId?:number;timestamp?:number;weightKg:number;note?:string|null;values?:MetricValue[]};
export function kgToDisplay(kg:number,unit:"kg"|"lb"="kg"){return unit==="kg"?kg:kg*2.2046226218;}
export function formatWeight(kg:number|null,unit:"kg"|"lb"="kg"){return kg==null||!Number.isFinite(kg)?"—":kgToDisplay(kg,unit).toFixed(1);}
