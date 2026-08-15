import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db/client.js";

// Применяет все .sql-миграции из ./drizzle к БД из DATABASE_URL.
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Миграции применены.");
await pool.end();
