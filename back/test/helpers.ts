import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import {
  MAHALLAS,
  MAHALLA_COORDS,
  MAHALLA_ID_BY_NAME,
  type Mahalla,
} from "../src/db/constants.js";
import { mahallas } from "../src/db/schema.js";
import type { SessionPayload } from "../src/plugins/auth.js";

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

// Детерминированно вставляет 12 махаллей (без людей) — для тестов meta/auth.
export async function seedMahallas(): Promise<void> {
  for (const name of MAHALLAS) {
    const [lat, lng] = MAHALLA_COORDS[name as Mahalla];
    await db
      .insert(mahallas)
      .values({ id: MAHALLA_ID_BY_NAME[name as Mahalla], name, lat, lng });
  }
}

// Подписывает JWT тем же секретом, что и приложение.
export function tokenFor(app: FastifyInstance, session: SessionPayload): string {
  return app.jwt.sign(session);
}
