import { eq, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { PROGRAMS, REVIEW_STATUSES, type Person } from "../db/constants.js";
import { db, type Tx } from "../db/client.js";
import { historyEvents, people } from "../db/schema.js";
import { httpError } from "../lib/errors.js";
import { ROLE_LABELS, resolveScope, type Scope } from "../lib/scope.js";
import { toPerson } from "../lib/serialize.js";
import { assertVisible, fetchHistory, fetchPersonRow } from "./people.js";

// «Сегодня» считает БД: и поля-даты, и дата события истории берут CURRENT_DATE
// в одной транзакции — расхождения между хостом и БД быть не может.
const TODAY = sql`CURRENT_DATE`;

type PersonRowLocked = typeof people.$inferSelect;

// Общий каркас всех мутаций (пп.8–11): в одной транзакции залочить строку
// FOR UPDATE, проверить скоуп, применить изменения и вернуть полный Person.
async function mutatePerson(
  req: FastifyRequest,
  run: (tx: Tx, row: PersonRowLocked, scope: Scope) => Promise<void>,
): Promise<Person> {
  const { id } = req.params as { id: string };
  const scope = resolveScope(req);

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(people)
      .where(eq(people.id, id))
      // FOR UPDATE только по people — параллельные мутации над одним человеком
      // не перемешают поля и историю.
      .for("update");

    if (!locked) {
      throw httpError("NOT_FOUND", "Человек не найден");
    }
    // Скоуп тот же, что у чтения: чужая махалля / ненаправленный на программу → 403.
    assertVisible(scope, locked);

    await run(tx, locked, scope);

    const row = await fetchPersonRow(tx, id);
    if (!row) {
      throw httpError("NOT_FOUND", "Человек не найден");
    }
    return toPerson(row, await fetchHistory(tx, id));
  });
}

const RouteBodySchema = z.object({
  program: z.enum(PROGRAMS),
  comment: z.string().optional(),
});

const ReviewStatusBodySchema = z.object({
  status: z.enum(REVIEW_STATUSES),
});

// Кем направлен — как во фронте (officerFromSession): подпись роли и, если
// роль привязана к махалле, её название.
function officerLabel(scope: Scope): string {
  const label = ROLE_LABELS[scope.role];
  return scope.mahallaName ? `${label} · ${scope.mahallaName}` : label;
}

// пп.8–11: мутации карточки. Каждая возвращает обновлённый Person целиком —
// фронту не нужно перезапрашивать карточку.
export async function mutationRoutes(app: FastifyInstance): Promise<void> {
  // п.8 — направить на программу.
  app.post(
    "/people/:id/route-to-program",
    { preHandler: [app.authenticate] },
    async (req) => {
      const parsed = RouteBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw httpError("BAD_REQUEST", "Некорректная программа");
      }
      const { program, comment } = parsed.data;

      return mutatePerson(req, async (tx, row, scope) => {
        await tx
          .update(people)
          .set({
            program,
            programOutcome: "Ожидает",
            programRoutedAt: TODAY,
            routedBy: officerLabel(scope),
            status: "Направлен на программу",
            outcome: "В процессе",
            neetReviewStatus: "Подтверждено",
            lastUpdate: TODAY,
          })
          .where(eq(people.id, row.id));

        await tx.insert(historyEvents).values({
          personId: row.id,
          date: TODAY,
          title: `Направлен на программу: ${program}`,
          note: comment ?? null,
          source: "программа",
        });
      });
    },
  );

  // п.9 — подтвердить статус. neet_review_status трогаем только у NEET.
  app.post(
    "/people/:id/confirm-status",
    { preHandler: [app.authenticate] },
    async (req) =>
      mutatePerson(req, async (tx, row) => {
        await tx
          .update(people)
          .set({
            lastUpdate: TODAY,
            ...(row.neet ? { neetReviewStatus: "Подтверждено" as const } : {}),
          })
          .where(eq(people.id, row.id));

        await tx.insert(historyEvents).values({
          personId: row.id,
          date: TODAY,
          title: "Статус подтверждён сотрудником",
        });
      }),
  );

  // п.10 — запросить уточнение. last_update НЕ меняется (как во фронте).
  app.post(
    "/people/:id/request-clarification",
    { preHandler: [app.authenticate] },
    async (req) =>
      mutatePerson(req, async (tx, row) => {
        await tx
          .update(people)
          .set({ neetReviewStatus: "На уточнении" })
          .where(eq(people.id, row.id));

        await tx.insert(historyEvents).values({
          personId: row.id,
          date: TODAY,
          title: "Запрошено уточнение данных",
        });
      }),
  );

  // п.11 — выставить review-статус вручную (канбан проверки NEET).
  app.patch(
    "/people/:id/review-status",
    { preHandler: [app.authenticate] },
    async (req) => {
      const parsed = ReviewStatusBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw httpError("BAD_REQUEST", "Некорректный статус проверки");
      }
      const { status } = parsed.data;

      return mutatePerson(req, async (tx, row) => {
        await tx
          .update(people)
          .set({ neetReviewStatus: status, lastUpdate: TODAY })
          .where(eq(people.id, row.id));

        await tx.insert(historyEvents).values({
          personId: row.id,
          date: TODAY,
          title: `Проверка NEET: ${status}`,
        });
      });
    },
  );
}
