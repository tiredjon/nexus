import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  sql,
} from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAHALLA_ID_BY_NAME } from "../db/constants.js";
import { db } from "../db/client.js";
import { historyEvents, mahallas, people } from "../db/schema.js";
import { httpError } from "../lib/errors.js";
import { resolveScope } from "../lib/scope.js";
import { toPersonListItem, toPerson, type PersonRow } from "../lib/serialize.js";

const PagedQuerySchema = z.object({
  query: z.string().optional(),
  mahalla: z.string().optional(),
  status: z
    .enum([
      "Работает",
      "Безработный",
      "Учится",
      "Предприниматель",
      "Другая деятельность",
      "Статус не уточнён",
      "Направлен на программу",
    ])
    .optional(),
  ageMin: z.coerce.number().int().min(18).max(30).default(18),
  ageMax: z.coerce.number().int().min(18).max(30).default(30),
  neet: z.enum(["true"]).optional(),
  needsSupport: z.enum(["true"]).optional(),
  stale: z.enum(["true"]).optional(),
  sort: z.enum(["fullName", "age", "mahalla", "lastUpdate"]).default("fullName"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

type PagedQuery = z.infer<typeof PagedQuerySchema>;

const SORT_FIELD_MAP: Record<PagedQuery["sort"], any> = {
  fullName: people.fullName,
  age: people.age,
  mahalla: mahallas.name,
  lastUpdate: people.lastUpdate,
};

const COLLATE = sql`COLLATE "ru-RU-x-icu"`;

// пп.6–7: список людей и карточка одного.
export async function peopleRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/people — список с фильтрами, поиском, пагинацией и сортировкой.
  app.get("/people", { preHandler: [app.authenticate] }, async (req) => {
    const parsed = PagedQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw httpError("BAD_REQUEST", "Некорректные параметры запроса");
    }

    const query = parsed.data;
    const scope = resolveScope(req);

    // Скоуп: mahalla-роль видит только свою махаллю.
    if (
      scope.role === "mahalla" &&
      query.mahalla &&
      query.mahalla !== scope.mahallaName
    ) {
      throw httpError("FORBIDDEN", "Доступ запрещён");
    }

    const whereConditions: any[] = [];

    // Динамический WHERE через drizzle.
    if (query.query) {
      whereConditions.push(ilike(people.fullName, `%${query.query}%`));
    }
    if (query.status) {
      whereConditions.push(eq(people.status, query.status));
    }
    if (query.ageMin !== undefined) {
      whereConditions.push(gte(people.age, query.ageMin));
    }
    if (query.ageMax !== undefined) {
      whereConditions.push(lte(people.age, query.ageMax));
    }
    if (query.neet === "true") {
      whereConditions.push(eq(people.neet, true));
    }
    if (query.needsSupport === "true") {
      whereConditions.push(eq(people.needsSupport, true));
    }
    if (query.stale === "true") {
      whereConditions.push(
        sql`${people.lastUpdate} < CURRENT_DATE - INTERVAL '90 days'`,
      );
    }

    // Скоуп: mahalla-роль видит только свою махаллю; district видит всех (или фильтрует по махалле).
    if (scope.role === "mahalla") {
      whereConditions.push(eq(people.mahallaId, scope.mahallaId!));
    } else if (query.mahalla) {
      // district может фильтровать ?mahalla=
      const mahallaId = (MAHALLA_ID_BY_NAME as Record<string, number>)[
        query.mahalla
      ];
      if (mahallaId) {
        whereConditions.push(eq(people.mahallaId, mahallaId));
      }
      // Если неизвестная махалля, просто не фильтруем (пустой результат)
    }

    // Получим MAHALLA_ID_BY_NAME для преобразования имени в id. Проще через JOIN.
    const sortField = SORT_FIELD_MAP[query.sort];
    const orderFn = query.order === "asc" ? asc : desc;

    // Два запроса: SELECT + COUNT.
    const countResult = await db
      .select({ count: sql<string>`cast(count(*) as text)` })
      .from(people)
      .leftJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(and(...whereConditions));

    const total = parseInt(countResult[0]?.count || "0", 10);

    // Для сортировки по махалле нужен JOIN. Строим запрос с правильной сортировкой.
    const selectQuery = db
      .select({
        id: people.id,
        fullName: people.fullName,
        age: people.age,
        gender: people.gender,
        mahallaId: people.mahallaId,
        mahallaName: mahallas.name,
        status: people.status,
        activity: people.activity,
        lastUpdate: people.lastUpdate,
        needsSupport: people.needsSupport,
        neet: people.neet,
        neetReviewStatus: people.neetReviewStatus,
        hasProfession: people.hasProfession,
        businessInterest: people.businessInterest,
        droppedStudies: people.droppedStudies,
        program: people.program,
        outcome: people.outcome,
      })
      .from(people)
      .leftJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(and(...whereConditions));

    // Сортировка с русской коллацией для текстовых полей.
    const sortedQuery =
      query.sort === "mahalla"
        ? selectQuery.orderBy(orderFn(sql`${mahallas.name} ${COLLATE}`))
        : query.sort === "fullName"
          ? selectQuery.orderBy(orderFn(sql`${people.fullName} ${COLLATE}`))
          : selectQuery.orderBy(orderFn(sortField));

    // Пагинация.
    const offset = (query.page - 1) * query.pageSize;
    const items = await sortedQuery.limit(query.pageSize).offset(offset);

    const totalPages = Math.ceil(total / query.pageSize);
    return {
      items: items.map((row) => toPersonListItem(row as PersonRow)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
    };
  });

  // GET /api/people/:id — полный профиль с историей.
  app.get("/people/:id", { preHandler: [app.authenticate] }, async (req) => {
    const { id } = req.params as { id: string };
    const scope = resolveScope(req);

    // Загрузим человека с JOIN на махаллю.
    const rows = await db
      .select({
        id: people.id,
        fullName: people.fullName,
        age: people.age,
        gender: people.gender,
        mahallaId: people.mahallaId,
        mahallaName: mahallas.name,
        status: people.status,
        activity: people.activity,
        lastUpdate: people.lastUpdate,
        needsSupport: people.needsSupport,
        neet: people.neet,
        neetReviewStatus: people.neetReviewStatus,
        hasProfession: people.hasProfession,
        businessInterest: people.businessInterest,
        droppedStudies: people.droppedStudies,
        program: people.program,
        outcome: people.outcome,
      })
      .from(people)
      .leftJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(eq(people.id, id));

    const row = rows[0];
    if (!row) {
      throw httpError("NOT_FOUND", "Человек не найден");
    }

    // Скоуп: mahalla-роль видит только свою махаллю.
    if (scope.role === "mahalla" && row.mahallaId !== scope.mahallaId) {
      throw httpError("FORBIDDEN", "Доступ запрещён");
    }

    // Загрузим историю.
    const historyRows = await db
      .select({
        date: historyEvents.date,
        title: historyEvents.title,
        note: historyEvents.note,
      })
      .from(historyEvents)
      .where(eq(historyEvents.personId, id))
      .orderBy(asc(historyEvents.date), asc(historyEvents.id));

    const history = historyRows.map((h) => ({
      date: h.date,
      title: h.title,
      note: h.note ?? undefined,
    }));

    return toPerson(row as PersonRow, history);
  });
}
