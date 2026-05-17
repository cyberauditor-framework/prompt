import path from "node:path";
import { ensureDbExists, runSqlFile } from "./database.js";

async function main() {
  await ensureDbExists();

  const schema = path.resolve(process.cwd(), "sql", "01_schema.sql");
  const seed = path.resolve(process.cwd(), "sql", "02_seed_initial_patterns.sql");

  await runSqlFile(schema);
  await runSqlFile(seed);

  console.log("Database initialized at prompt_db.sqlite");
}

main().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
