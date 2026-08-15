import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import {
  PROGRAMS,
  REVIEW_STATUSES,
  STATUSES,
  type EmploymentStatus,
  type Program,
} from "../db/constants.js";
import { db } from "../db/client.js";
import { mahallas, people } from "../db/schema.js";
import { resolveScope, type Scope } from "../lib/scope.js";
import { toPersonListItem } from "../lib/serialize.js";
import { personColumns, scopeConditions } from "./people.js";

// Подписи месяцев — как во фронте (neetMonthlyTrend / analytics.tsx): витрина
// демонстрационная, шесть последних месяцев зафиксированы строками.
const MONTHS = ["Март", "Апрель", "Май", "Июнь", "Июль", "Август"] as const;

// Все агрегаты живут под одним и тем же скоупом, что и чтения S3:
// own_mahalla → своя махалля, routed_only → только направленные на программу.
function scopeFilter(scope: Scope): SQL {
  const conds = scopeConditions(scope);
  return conds.length > 0 ? and(...conds)! : sql`true`;
}

// Агрегаты «по махаллям» строятся от таблицы mahallas через LEFT JOIN, чтобы
// в ответе остались и пустые махалли (фронт рисует все 12 столбцов). Скоуп
// людей уезжает в ON, скоуп самих махаллей — в WHERE.
function mahallaScope(scope: Scope): { join: SQL; where: SQL } {
  const conds = scopeConditions(scope);
  const join = and(eq(people.mahallaId, mahallas.id), ...conds)!;
  const where =
    scope.kind === "own_mahalla" ? eq(mahallas.id, scope.mahallaId!) : sql`true`;
  return { join, where };
}

const EMPLOYED = sql`${people.status} IN ('Работает','Предприниматель')`;
const OTHER_ACTIVITY = sql`${people.status} IN ('Другая деятельность','Направлен на программу')`;
const SUCCEEDED = sql`${people.outcome} IN ('Трудоустроен','Учится')`;
const STALE = sql`${people.lastUpdate} < CURRENT_DATE - 90`;

// Тренд NEET по месяцам — демонстрационная кривая от одного числа T
// (backend.md §3 п.12). Ровно та же формула, что в neetMonthlyTrend фронта.
function neetTrend(total: number): { month: string; neet: number }[] {
  return MONTHS.map((month, i) => ({
    month,
    neet: Math.round(total * (1.22 - i * 0.04) + ((i * 7) % 5)),
  }));
}

// Помесячная динамика программ — тоже витрина от двух чисел (п.15).
function monthlyProgress(
  routed: number,
  succeeded: number,
): { month: string; routed: number; employed: number }[] {
  return MONTHS.map((month, i) => ({
    month,
    routed: Math.max(3, Math.round(routed / 6 + ((i * 5) % 7) - 2)),
    employed: Math.max(1, Math.round(succeeded / 6 + ((i * 3) % 5) - 1)),
  }));
}

// пп.12–15: агрегаты для дашборда, карты, канбана проверки и аналитики.
// Всё считается в SQL (count(*) FILTER / GROUP BY), в JS остаются только
// две демо-формулы, которым нужны уже посчитанные числа.
export async function statsRoutes(app: FastifyInstance): Promise<void> {
  // п.12 — дашборд: KPI, разрезы по статусу и махаллям, тренд, «требуют внимания».
  app.get("/stats/dashboard", { preHandler: [app.authenticate] }, async (req) => {
    const scope = resolveScope(req);
    const where = scopeFilter(scope);
    const byMahallaScope = mahallaScope(scope);

    const kpiQuery = db
      .select({
        total: sql<number>`count(*)::int`,
        employed: sql<number>`count(*) FILTER (WHERE ${EMPLOYED})::int`,
        unemployed: sql<number>`count(*) FILTER (WHERE ${people.status} = 'Безработный')::int`,
        neet: sql<number>`count(*) FILTER (WHERE ${people.neet})::int`,
        unknown: sql<number>`count(*) FILTER (WHERE ${people.status} = 'Статус не уточнён')::int`,
        stale: sql<number>`count(*) FILTER (WHERE ${STALE})::int`,
      })
      .from(people)
      .where(where);

    const statusQuery = db
      .select({ status: people.status, count: sql<number>`count(*)::int` })
      .from(people)
      .where(where)
      .groupBy(people.status);

    const mahallaQuery = db
      .select({
        mahalla: mahallas.name,
        employed: sql<number>`count(*) FILTER (WHERE ${EMPLOYED})::int`,
        studying: sql<number>`count(*) FILTER (WHERE ${people.status} = 'Учится')::int`,
        neet: sql<number>`count(*) FILTER (WHERE ${people.neet})::int`,
        other: sql<number>`count(*) FILTER (WHERE ${OTHER_ACTIVITY})::int`,
      })
      .from(mahallas)
      .leftJoin(people, byMahallaScope.join)
      .where(byMahallaScope.where)
      .groupBy(mahallas.id, mahallas.name)
      .orderBy(asc(mahallas.id));

    // Самые «протухшие» ожидающие проверки — первыми.
    const attentionQuery = db
      .select(personColumns)
      .from(people)
      .innerJoin(mahallas, eq(people.mahallaId, mahallas.id))
      .where(
        and(
          where,
          eq(people.neet, true),
          eq(people.neetReviewStatus, "Ожидает проверки"),
        ),
      )
      .orderBy(asc(people.lastUpdate), asc(people.id))
      .limit(5);

    const [kpiRows, statusRows, byMahalla, attention] = await Promise.all([
      kpiQuery,
      statusQuery,
      mahallaQuery,
      attentionQuery,
    ]);

    const kpi = kpiRows[0]!;
    // Статусы отдаём всеми семью в порядке STATUSES — GROUP BY возвращает
    // только встретившиеся, недостающие добиваем нулями.
    const counts = new Map(statusRows.map((r) => [r.status as EmploymentStatus, r.count]));
    const byStatus = STATUSES.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));

    return {
      kpi,
      byStatus,
      byMahalla,
      neetTrend: neetTrend(kpi.neet),
      attention: attention.map(toPersonListItem),
    };
  });

  // п.13 — данные для карты района: по одной строке на махаллю.
  app.get("/stats/map", { preHandler: [app.authenticate] }, async (req) => {
    const scope = resolveScope(req);
    const { join, where } = mahallaScope(scope);

    return db
      .select({
        mahalla: mahallas.name,
        lat: mahallas.lat,
        lng: mahallas.lng,
        total: sql<number>`count(${people.id})::int`,
        employed: sql<number>`count(*) FILTER (WHERE ${EMPLOYED})::int`,
        neet: sql<number>`count(*) FILTER (WHERE ${people.neet})::int`,
        // Доля NEET в процентах с одной десятичной; пустая махалля → 0, а не NULL.
        share: sql<number>`COALESCE(round(
          count(*) FILTER (WHERE ${people.neet})::numeric * 100
          / NULLIF(count(${people.id}), 0), 1), 0)::float8`,
      })
      .from(mahallas)
      .leftJoin(people, join)
      .where(where)
      .groupBy(mahallas.id, mahallas.name, mahallas.lat, mahallas.lng)
      .orderBy(asc(mahallas.id));
  });

  // п.14 — канбан проверки NEET: 4 колонки в порядке REVIEW_STATUSES.
  app.get("/stats/review", { preHandler: [app.authenticate] }, async (req) => {
    const scope = resolveScope(req);
    const where = and(
      scopeFilter(scope),
      // Множество кейсов канбана: все NEET плюс те, у кого проверка не закрыта.
      sql`(${people.neet} OR ${people.neetReviewStatus} <> 'Флаг снят')`,
    );

    const columns = await Promise.all(
      REVIEW_STATUSES.map(async (status) => {
        const rows = await db
          .select(personColumns)
          .from(people)
          .innerJoin(mahallas, eq(people.mahallaId, mahallas.id))
          .where(and(where, eq(people.neetReviewStatus, status)))
          .orderBy(asc(people.lastUpdate), asc(people.id))
          .limit(40);
        return { status, items: rows.map(toPersonListItem) };
      }),
    );

    return { columns };
  });

  // п.15 — аналитика: воронка сопровождения, эффективность программ, помесячно.
  app.get("/stats/analytics", { preHandler: [app.authenticate] }, async (req) => {
    const scope = resolveScope(req);
    const where = scopeFilter(scope);

    const funnelQuery = db
      .select({
        detected: sql<number>`count(*) FILTER (WHERE ${people.neet} OR ${people.status} = 'Направлен на программу')::int`,
        checked: sql<number>`count(*) FILTER (WHERE ${people.neetReviewStatus} IN ('Подтверждено','На уточнении'))::int`,
        routed: sql<number>`count(*) FILTER (WHERE ${people.program} IS NOT NULL)::int`,
        succeeded: sql<number>`count(*) FILTER (WHERE ${SUCCEEDED})::int`,
      })
      .from(people)
      .where(where);

    const programsQuery = db
      .select({
        program: people.program,
        sent: sql<number>`count(*)::int`,
        ok: sql<number>`count(*) FILTER (WHERE ${SUCCEEDED})::int`,
      })
      .from(people)
      .where(and(where, sql`${people.program} IS NOT NULL`))
      .groupBy(people.program);

    const [funnelRows, programRows] = await Promise.all([funnelQuery, programsQuery]);
    const f = funnelRows[0]!;

    // Все 5 программ в порядке PROGRAMS; неиспользованные — с нулями (rate 0).
    const sentBy = new Map(programRows.map((r) => [r.program as Program, r]));
    const programs = PROGRAMS.map((program) => {
      const row = sentBy.get(program);
      const sent = row?.sent ?? 0;
      const ok = row?.ok ?? 0;
      return { program, sent, ok, rate: sent > 0 ? Math.round((ok / sent) * 100) : 0 };
    });

    return {
      funnel: [
        { stage: "Выявлен", value: f.detected },
        { stage: "Проверен", value: f.checked },
        { stage: "Направлен на программу", value: f.routed },
        { stage: "Трудоустроен / учится", value: f.succeeded },
      ],
      programs,
      monthly: monthlyProgress(f.routed, f.succeeded),
    };
  });
}
