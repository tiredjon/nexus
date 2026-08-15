import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../src/db/client.js";
import { STATUSES } from "../src/db/constants.js";
import { truncateAll } from "./helpers.js";

const run = promisify(execFile);
const backDir = fileURLToPath(new URL("..", import.meta.url));

// Гоняем реальный seed.ts как подпроцесс — проверяем сидер целиком, а не его
// внутренности. fileParallelism:false гарантирует, что чужие тесты не мешают БД.
describe("seed script", () => {
  beforeAll(async () => {
    await truncateAll();
    await run("npx", ["tsx", "scripts/seed.ts", "--count", "50", "--anchor", "2026-08-15"], {
      cwd: backDir,
      env: process.env,
    });
  }, 60_000);

  afterAll(async () => {
    await truncateAll();
  });

  it("создаёт ровно 50 людей", async () => {
    const { rows } = await db.execute<{ n: number }>(
      sql`SELECT count(*)::int AS n FROM people`,
    );
    expect(rows[0]!.n).toBe(50);
  });

  it("создаёт строки истории", async () => {
    const { rows } = await db.execute<{ n: number }>(
      sql`SELECT count(*)::int AS n FROM history_events`,
    );
    expect(rows[0]!.n).toBeGreaterThan(0);
  });

  it("все статусы людей валидны", async () => {
    const { rows } = await db.execute<{ status: string }>(
      sql`SELECT DISTINCT status FROM people`,
    );
    for (const { status } of rows) {
      expect(STATUSES as readonly string[]).toContain(status);
    }
  });

  it("сидит 12 махаллей", async () => {
    const { rows } = await db.execute<{ n: number }>(
      sql`SELECT count(*)::int AS n FROM mahallas`,
    );
    expect(rows[0]!.n).toBe(12);
  });
});
