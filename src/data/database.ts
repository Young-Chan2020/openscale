import type {SQLiteDatabase} from "expo-sqlite";
import type {Measurement,NewMeasurement} from "@/domain/measurement";

export async function initDatabase(db:SQLiteDatabase){
 await db.execAsync(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY NOT NULL,name TEXT NOT NULL,height_cm REAL,birth_year INTEGER,sex TEXT NOT NULL DEFAULT 'unspecified',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS measurements(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL DEFAULT 1,timestamp INTEGER NOT NULL,weight_kg REAL,note TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,UNIQUE(user_id,timestamp));
 CREATE INDEX IF NOT EXISTS idx_measurements_user_timestamp ON measurements(user_id,timestamp DESC);
 CREATE TABLE IF NOT EXISTS measurement_values(id INTEGER PRIMARY KEY AUTOINCREMENT,measurement_id INTEGER NOT NULL,metric_key TEXT NOT NULL,numeric_value REAL,text_value TEXT,unit TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT 'manual',FOREIGN KEY(measurement_id) REFERENCES measurements(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY NOT NULL,value TEXT NOT NULL);
 INSERT OR IGNORE INTO users(id,name,created_at) VALUES(1,'Me',strftime('%s','now')*1000);`);
}
export async function listMeasurements(db:SQLiteDatabase,userId=1):Promise<Measurement[]>{
 const rows=await db.getAllAsync<{id:number;user_id:number;timestamp:number;weight_kg:number|null;note:string|null}>("SELECT id,user_id,timestamp,weight_kg,note FROM measurements WHERE user_id=? ORDER BY timestamp DESC",userId);
 return rows.map(r=>({id:r.id,userId:r.user_id,timestamp:r.timestamp,weightKg:r.weight_kg,note:r.note,values:[]}));
}
export async function addMeasurement(db:SQLiteDatabase,input:NewMeasurement){
 if(!Number.isFinite(input.weightKg)||input.weightKg<=0||input.weightKg>1000)throw new Error("Enter a valid weight in kilograms.");
 const result=await db.runAsync("INSERT INTO measurements(user_id,timestamp,weight_kg,note) VALUES(?,?,?,?)",input.userId??1,input.timestamp??Date.now(),input.weightKg,input.note??null);
 return result.lastInsertRowId;
}
export async function deleteMeasurement(db:SQLiteDatabase,id:number){await db.runAsync("DELETE FROM measurements WHERE id=?",id);}
export async function getUserProfile(db:SQLiteDatabase,userId=1){return db.getFirstAsync<{id:number;name:string;height_cm:number|null;birth_year:number|null;sex:"female"|"male"|"unspecified"}>("SELECT id,name,height_cm,birth_year,sex FROM users WHERE id=?",userId);}
export async function updateUserProfile(db:SQLiteDatabase,p:{name:string;heightCm:number|null;birthYear:number|null;sex:"female"|"male"|"unspecified"},id=1){
 await db.runAsync("UPDATE users SET name=?,height_cm=?,birth_year=?,sex=? WHERE id=?",p.name.trim()||"Me",p.heightCm,p.birthYear,p.sex,id);
}
