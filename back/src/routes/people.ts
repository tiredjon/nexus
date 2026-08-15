import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  isNotNull,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAHALLA_ID_BY_NAME, STATUSES } from "../db/constants.js";
import { db } from "../db/client.js";
import { historyEvents, mahallas, people } from "../db/schema.js";
import { httpError } from "../lib/errors.js";
import { resolveScope, type Scope } from "../lib/scope.js";
import { toPerson, toPersonListItem, type PersonRow } from "../lib/serialize.js";

// Все скалярные колонки people + имя махалли из JOIN — ровно то, что ждёт
// toPersonListItem/toPerson.
const personColumns = { ...getTableColumns(people), mahallaName: mahallas.name };

const ListQuerySchema = z.object({
  query: z.string().optional(),
  mahalla: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  ageMin: z.coerce.number().int().min(18).max(30).default(18),
  ageMax: z.coerce.number().int().min(18).max(30).default(30),
  neet: z.literal("true").optional(),
  needsSupport: z.literal("true").optional(),
  stale: z.literal("true").optional(),
  sort: z.enum(["fullName", "age", "mahalla", "lastUpdate"]).default("fullName"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

type ListQuery = z.infer<typeof ListQuerySchema>;

// Сортировка только из whitelist — значение из query никогда не попадает в
// ORDER BY напрямую. Текстовые поля сортируются русской коллацией.
const SORT_EXPR: Record<ListQuery["sort"], SQL> = {
  fullName: sql`${people.fullName} COLLATE "ru-RU-x-icu"`,
  age: sql`${people.age}`,
  mahalla: sql`${mahallas.name} COLLATE "ru-RU-x-icu"`,
  lastUpdate: sql`${people.lastUpdate}`,
};

// Ограничения доступа из роли (backend.md §3, «правило скоупа»):
// own_mahalla → только своя махалля, чужой ?mahalla= = 403;
// routed_only → только направленные на программу;
// all_mahallas / all_data → без ограничений.
function scopeConditions(scope: Scope, requestedMahalla?: string): SQL[] {
  const conds: SQL[] = [];

  if (scope.kind === "own_mahalla") {
    if (scope.mahallaId === null) {
      throw httpError("FORBIDDEN", "Роль требует привязки к махалле");
    }
    if (requestedMahalla && requestedMahalla !== scope.mahallaName) {
      throw httpError("FORBIDDEN", "Доступ к чужой махалле запрещён");
    }
    conds.push(eq(people.mahallaId, scope.mahallaId));
    return conds;
  }

  if (scope.kind === "routed_only") {
    conds.push(isNotNull(people.program));
  }

  // Роли, видящие все махалли, могут сузиться параметром ?mahalla=.
  if (requestedMahalla) {
    const mahallaId = (MAHALLA_ID_BY_NAME as Record<string, number | undefined>)[
      requestedMahalla
    ];
    if (mahallaId === undefined) {
      throw httpError("BAD_REQUEST", "Неизвестная махалля");
    }
    conds.push(eq(people.mahallaId, mahallaId));
  }

  return conds;
}

// Виден ли конкретный человек в текущем скоупе (для GET /people/:id).
function assertVisible(scope: Scope, row: PersonRow): void {
  if (scope.kind === "own_mahalla" && row.mahallaId !== scope.mahallaId) {
    throw httpError("FORBIDDEN", "Доступ к чужой махалле запрещён");
  }
  if (scope.kind === "routed_only" && row.program === null) {
    throw httpError("FORBIDDEN", "Доступ ограничен направленными на программу");
  }
}

// пп.6–7: список людей и карточка одного.
export async function peopleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/people", { preHandler: [app.authenticate] }, async (req) => {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw httpError("BAD_REQUEST", "Некорректные параметры запроса");
    }
    const q = parsed.data;
    if (q.ageMin > q.ageMax) {
      throw httpError("BAD_REQUEST", "ageMin не может быть больше ageMax");
    }

    const scope = resolveScope(req);
    const conds: SQL[] = scopeConditions(scope, q.mahalla);

    // Вся фильтрация — в SQL; ILIKE идёт по trigram-индексу people_full_name_trgm_idx.
    if (q.query?.trim()) {
      conds.push(ilike(people.fullName, `%${q.query.trim()}%`));
    }
    if (q.status) conds.push(eq(people.status, q.status));
    conds.push(gte(people.age, q.ageMin));
    conds.push(lte(people.age, q.ageMax));
    if (q.neet) conds.push(eq(people.neet, true));
    if (q.needsSupport) conds.push(eq(people.needsSupport, true));
    if (q.stale) {
      conds.push(sql`${people.lastUpdate} < CURRENT_DATE - 90`);
    }

    const where = and(...conds);

    // total считаем отдельным count(*) с тем же WHERE (backend.md §3 п.6).
    const [counted] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(people)
      .innerJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(where);
    const total = counted?.total ?? 0;

    const orderFn = q.order === "asc" ? asc : desc;
    const rows = await db
      .select(personColumns)
      .from(people)
      .innerJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(where)
      // id вторым ключом — иначе страницы при равных значениях сортировки «плывут».
      .orderBy(orderFn(SORT_EXPR[q.sort]), asc(people.id))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize);

    return {
      items: rows.map(toPersonListItem),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    };
  });

  app.get("/people/:id", { preHandler: [app.authenticate] }, async (req) => {
    const { id } = req.params as { id: string };
    const scope = resolveScope(req);

    const [row] = await db
      .select(personColumns)
      .from(people)
      .innerJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(eq(people.id, id));

    if (!row) {
      throw httpError("NOT_FOUND", "Человек не найден");
    }
    assertVisible(scope, row);

    const events = await db
      .select({
        date: historyEvents.date,
        title: historyEvents.title,
        note: historyEvents.note,
        source: historyEvents.source,
      })
      .from(historyEvents)
      .where(eq(historyEvents.personId, id))
      .orderBy(asc(historyEvents.date), asc(historyEvents.id));

    // В контракте note/source опциональны — NULL из БД отдаём как отсутствующие.
    const history = events.map((e) => ({
      date: e.date,
      title: e.title,
      note: e.note ?? undefined,
      source: e.source ?? undefined,
    }));

    return toPerson(row, history);
  });
}
