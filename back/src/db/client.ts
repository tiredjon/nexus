import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type DB = typeof db;

// Пул или транзакция: запросы-хелперы одинаково работают и снаружи, и внутри
// db.transaction() (мутации читают ту же строку, которую только что залочили).
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Runner = DB | Tx;
