import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { db } from "../src/db/client.js";

export { buildApp };

// Чистит все доменные таблицы между тестами. CASCADE + RESTART IDENTITY, чтобы
// сброс history_events.id был предсказуемым.
export async function truncateAll(): Promise<void> {
  await db.execute(
    sql`TRUNCATE people, history_events, mahallas RESTART IDENTITY CASCADE`,
  );
}

export async function makeApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}
