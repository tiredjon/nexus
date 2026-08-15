import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";

// GET /health — без auth. Проверяет доступность БД через SELECT 1.
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_req, reply) => {
    try {
      await db.execute(sql`SELECT 1`);
      return { status: "ok", db: "ok" };
    } catch {
      reply.status(503);
      return { status: "error", db: "down" };
    }
  });
}
