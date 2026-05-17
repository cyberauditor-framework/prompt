import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

const newsDbPath = path.resolve(process.cwd(), "news.sqlite");

export async function getNewsDb(): Promise<Database> {
  const db = await open({
    filename: newsDbPath,
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export async function ensureNewsDbExists() {
  const exists = fs.existsSync(newsDbPath);
  if (!exists) {
    const db = await getNewsDb();
    await db.close();
  }
}

export function getNewsDbPath() {
  return newsDbPath;
}
