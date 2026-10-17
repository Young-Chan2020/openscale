import type {SQLiteDatabase} from "expo-sqlite";
import type {Measurement,MetricValue,NewMeasurement} from "@/domain/measurement";

export async function initDatabase(db:SQLiteDatabase){
 await db.execAsync(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY NOT NULL,name TEXT NOT NULL,height_cm REAL,birth_year INTEGER,sex TEXT NOT NULL DEFAULT 'unspecified',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS measurements(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL DEFAULT 1,timestamp INTEGER NOT NULL,weight_kg REAL,note TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,UNIQUE(user_id,timestamp));
 CREATE INDEX IF NOT EXISTS idx_measurements_user_timestamp ON measurements(user_id,timestamp DESC);
 CREATE TABLE IF NOT EXISTS measurement_values(id INTEGER PRIMARY KEY AUTOINCREMENT,measurement_id INTEGER NOT NULL,metric_key TEXT NOT NULL,numeric_value REAL,text_value TEXT,unit TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT 'manual',FOREIGN KEY(measurement_id) REFERENCES measurements(id) ON DELETE CASCADE);
 CREATE INDEX IF NOT EXISTS idx_measurement_values_measurement ON measurement_values(measurement_id);
 CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY NOT NULL,value TEXT NOT NULL);
 INSERT OR IGNORE INTO users(id,name,created_at) VALUES(1,'Me',strftime('%s','now')*1000);`);
}
export async function listMeasurements(db:SQLiteDatabase,userId=1):Promise<Measurement[]>{
 const rows=await db.getAllAsync<{id:number;user_id:number;timestamp:number;weight_kg:number|null;note:string|null}>("SELECT id,user_id,timestamp,weight_kg,note FROM measurements WHERE user_id=? ORDER BY timestamp DESC",userId);
 if(!rows.length)return [];
 const ids=rows.map(r=>r.id),placeholders=ids.map(()=>"?").join(",");
 const values=await db.getAllAsync<{measurement_id:number;metric_key:string;numeric_value:number|null;text_value:string|null;unit:string;source:string}>(`SELECT measurement_id,metric_key,numeric_value,text_value,unit,source FROM measurement_values WHERE measurement_id IN (${placeholders}) ORDER BY id`,...ids);
 const grouped=new Map<number,MetricValue[]>();
 for(const v of values){const list=grouped.get(v.measurement_id)??[];list.push({key:v.metric_key,value:v.numeric_value??v.text_value??"",unit:v.unit,source:(["scale","derived","manual"].includes(v.source)?v.source:"scale") as MetricValue["source"]});grouped.set(v.measurement_id,list);}
 return rows.map(r=>({id:r.id,userId:r.user_id,timestamp:r.timestamp,weightKg:r.weight_kg,note:r.note,values:grouped.get(r.id)??[]}));
}
export async function addMeasurement(db:SQLiteDatabase,input:NewMeasurement){
 if(!Number.isFinite(input.weightKg)||input.weightKg<=0||input.weightKg>1000)throw new Error("Enter a valid weight in kilograms.");
 await db.withTransactionAsync(async()=>{
  const result=await db.runAsync("INSERT INTO measurements(user_id,timestamp,weight_kg,note) VALUES(?,?,?,?)",input.userId??1,input.timestamp??Date.now(),input.weightKg,input.note??null);
  for(const metric of input.values??[]){
   const numeric=typeof metric.value==="number"?metric.value:null,textValue=typeof metric.value==="string"?metric.value:null;
   await db.runAsync("INSERT INTO measurement_values(measurement_id,metric_key,numeric_value,text_value,unit,source) VALUES(?,?,?,?,?,?)",result.lastInsertRowId,metric.key,numeric,textValue,metric.unit,metric.source);
  }
 });
}
export async function deleteMeasurement(db:SQLiteDatabase,id:number){await db.runAsync("DELETE FROM measurements WHERE id=?",id);}
export async function getUserProfile(db:SQLiteDatabase,userId=1){return db.getFirstAsync<{id:number;name:string;height_cm:number|null;birth_year:number|null;sex:"female"|"male"|"unspecified"}>("SELECT id,name,height_cm,birth_year,sex FROM users WHERE id=?",userId);}
export async function updateUserProfile(db:SQLiteDatabase,p:{name:string;heightCm:number|null;birthYear:number|null;sex:"female"|"male"|"unspecified"},id=1){
 await db.runAsync("UPDATE users SET name=?,height_cm=?,birth_year=?,sex=? WHERE id=?",p.name.trim()||"Me",p.heightCm,p.birthYear,p.sex,id);
}
