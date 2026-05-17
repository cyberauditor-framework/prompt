import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

const dbPath = path.resolve(process.cwd(), "prompt_db.sqlite");

export async function getDb(): Promise<Database> {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export async function runSqlFile(filePath: string) {
  const sql = fs.readFileSync(filePath, "utf-8");
  const db = await getDb();
  await db.exec(sql);
  await db.close();
}

export async function ensureDbExists() {
  const exists = fs.existsSync(dbPath);
  if (!exists) {
    const db = await getDb();
    await db.close();
  }
}
