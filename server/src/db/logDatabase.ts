import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

const logDbPath = path.resolve(process.cwd(), "prompt_logs.sqlite");

export async function getLogDb(): Promise<Database> {
  const db = await open({
    filename: logDbPath,
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export async function ensureLogDbExists() {
  const exists = fs.existsSync(logDbPath);
  if (!exists) {
    const db = await getLogDb();
    await db.close();
  }
}

export function getLogDbPath() {
  return logDbPath;
}
