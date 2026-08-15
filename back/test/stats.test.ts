import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { REVIEW_STATUSES, STATUSES } from "../src/db/constants.js";
import { makeApp, seedStatsFixture, tokenFor, truncateAll } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await truncateAll();
  await seedStatsFixture();
});

// district_officer → all_mahallas: весь срез из 24 человек.
const districtToken = () => tokenFor(app, { role: "district_officer", mahalla: null });
// mahalla_officer → own_mahalla: только Дархан (12 человек).
const darkhanToken = () => tokenFor(app, { role: "mahalla_officer", mahalla: "Дархан" });
// employment_specialist → routed_only: только направленные на программу (4).
const specialistToken = () =>
  tokenFor(app, { role: "employment_specialist", mahalla: null });

async function get(url: string, token: string) {
  return app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}` } });
}

const ids = (items: { id: string }[]) => items.map((p) => p.id);

describe("GET /api/stats/dashboard", () => {
  it("считает KPI по всему району", async () => {
    const res = await get("/api/stats/dashboard", districtToken());
    expect(res.statusCode).toBe(200);
    expect(res.json().kpi).toEqual({
      total: 24,
      employed: 7,
      unemployed: 5,
      neet: 9,
      unknown: 3,
      stale: 5,
    });
  });

  it("отдаёт все 7 статусов в порядке STATUSES, включая нулевые", async () => {
    const { byStatus } = (await get("/api/stats/dashboard", districtToken())).json();
    expect(byStatus.map((s: { status: string }) => s.status)).toEqual([...STATUSES]);
    expect(byStatus).toEqual([
      { status: "Работает", count: 5 },
      { status: "Безработный", count: 5 },
      { status: "Учится", count: 3 },
      { status: "Предприниматель", count: 2 },
      { status: "Другая деятельность", count: 2 },
      { status: "Статус не уточнён", count: 3 },
      { status: "Направлен на программу", count: 4 },
    ]);
  });

  it("разрез по махаллям включает пустые махалли нулями", async () => {
    const { byMahalla } = (await get("/api/stats/dashboard", districtToken())).json();
    expect(byMahalla).toHaveLength(12);
    expect(byMahalla[0]).toEqual({
      mahalla: "Дархан",
      employed: 4,
      studying: 2,
      neet: 4,
      other: 3,
    });
    expect(byMahalla[1]).toEqual({
      mahalla: "Буюк Ипак Йули",
      employed: 2,
      studying: 1,
      neet: 3,
      other: 2,
    });
    expect(byMahalla[2]).toEqual({
      mahalla: "Олтинтепа",
      employed: 1,
      studying: 0,
      neet: 2,
      other: 1,
    });
    // Элобод (4-я по порядку) людей не имеет — строка есть, значения нулевые.
    expect(byMahalla[3]).toEqual({
      mahalla: "Элобод",
      employed: 0,
      studying: 0,
      neet: 0,
      other: 0,
    });
  });

  it("тренд NEET — 6 месяцев по формуле от общего числа NEET", async () => {
    const { neetTrend } = (await get("/api/stats/dashboard", districtToken())).json();
    // T = 9: round(9*(1.22 - i*0.04) + ((i*7) % 5))
    expect(neetTrend).toEqual([
      { month: "Март", neet: 11 },
      { month: "Апрель", neet: 13 },
      { month: "Май", neet: 14 },
      { month: "Июнь", neet: 11 },
      { month: "Июль", neet: 13 },
      { month: "Август", neet: 9 },
    ]);
  });

  it("«требуют внимания» — ожидающие проверки NEET, самые протухшие первыми", async () => {
    const { attention } = (await get("/api/stats/dashboard", districtToken())).json();
    expect(ids(attention)).toEqual(["Y-2021", "Y-2005", "Y-2006", "Y-2014"]);
    // Это PersonListItem: махалля именем-строкой, без history.
    expect(attention[0].mahalla).toBe("Олтинтепа");
    expect(attention[0]).not.toHaveProperty("history");
  });

  it("для роли махалли каждый показатель сужается до своей махалли", async () => {
    const body = (await get("/api/stats/dashboard", darkhanToken())).json();
    expect(body.kpi).toEqual({
      total: 12,
      employed: 4,
      unemployed: 2,
      neet: 4,
      unknown: 1,
      stale: 3,
    });
    expect(body.byMahalla).toEqual([
      { mahalla: "Дархан", employed: 4, studying: 2, neet: 4, other: 3 },
    ]);
    expect(ids(body.attention)).toEqual(["Y-2005", "Y-2006"]);
    expect(body.neetTrend[0]).toEqual({ month: "Март", neet: 5 }); // T = 4
  });

  it("для специалиста по занятости — только направленные на программу", async () => {
    const body = (await get("/api/stats/dashboard", specialistToken())).json();
    expect(body.kpi.total).toBe(4);
    expect(body.kpi.employed).toBe(0);
    expect(body.kpi.neet).toBe(2);
    expect(body.byMahalla[0]).toEqual({
      mahalla: "Дархан",
      employed: 0,
      studying: 0,
      neet: 1,
      other: 2,
    });
  });

  it("без токена — 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/stats/dashboard" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });
});

describe("GET /api/stats/map", () => {
  it("отдаёт 12 махаллей с координатами и долей NEET", async () => {
    const res = await get("/api/stats/map", districtToken());
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(12);
    expect(body[0]).toEqual({
      mahalla: "Дархан",
      lat: 41.3455,
      lng: 69.3105,
      total: 12,
      employed: 4,
      neet: 4,
      share: 33.3,
    });
    expect(body[1].share).toBe(37.5);
    expect(body[2].share).toBe(50);
  });

  it("пустая махалля — нули без деления на ноль", async () => {
    const body = (await get("/api/stats/map", districtToken())).json();
    expect(body[3]).toMatchObject({
      mahalla: "Элобод",
      total: 0,
      employed: 0,
      neet: 0,
      share: 0,
    });
  });

  it("для роли махалли — только своя махалля", async () => {
    const body = (await get("/api/stats/map", darkhanToken())).json();
    expect(body).toHaveLength(1);
    expect(body[0].mahalla).toBe("Дархан");
  });

  it("без токена — 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/stats/map" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/stats/review", () => {
  it("4 колонки в порядке REVIEW_STATUSES с нужным составом", async () => {
    const res = await get("/api/stats/review", districtToken());
    expect(res.statusCode).toBe(200);
    const { columns } = res.json();
    expect(columns.map((c: { status: string }) => c.status)).toEqual([...REVIEW_STATUSES]);
    // Внутри колонки — по возрастанию last_update, потом по id.
    expect(ids(columns[0].items)).toEqual(["Y-2021", "Y-2005", "Y-2006", "Y-2014"]);
    expect(ids(columns[1].items)).toEqual(["Y-2017", "Y-2007"]);
    expect(ids(columns[2].items)).toEqual([
      "Y-2008",
      "Y-2009",
      "Y-2016",
      "Y-2022",
      "Y-2023",
    ]);
    // «Флаг снят» — только NEET (не-NEET с закрытой проверкой в канбан не попадают).
    expect(ids(columns[3].items)).toEqual(["Y-2015"]);
  });

  it("не тянет в канбан не-NEET с закрытой проверкой", async () => {
    const { columns } = (await get("/api/stats/review", districtToken())).json();
    const total = columns.reduce(
      (n: number, c: { items: unknown[] }) => n + c.items.length,
      0,
    );
    expect(total).toBe(12); // 9 NEET + 3 не-NEET с открытой проверкой
  });

  it("для роли махалли — только своя махалля", async () => {
    const { columns } = (await get("/api/stats/review", darkhanToken())).json();
    expect(ids(columns[0].items)).toEqual(["Y-2005", "Y-2006"]);
    expect(ids(columns[1].items)).toEqual(["Y-2007"]);
    expect(ids(columns[2].items)).toEqual(["Y-2008", "Y-2009"]);
    expect(columns[3].items).toEqual([]);
  });

  it("без токена — 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/stats/review" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/stats/analytics", () => {
  it("воронка считается по формулам спеки", async () => {
    const res = await get("/api/stats/analytics", districtToken());
    expect(res.statusCode).toBe(200);
    expect(res.json().funnel).toEqual([
      { stage: "Выявлен", value: 11 },
      { stage: "Проверен", value: 7 },
      { stage: "Направлен на программу", value: 4 },
      { stage: "Трудоустроен / учится", value: 2 },
    ]);
  });

  it("все 5 программ в порядке PROGRAMS, rate = 0 при sent = 0", async () => {
    const { programs } = (await get("/api/stats/analytics", districtToken())).json();
    expect(programs).toEqual([
      { program: "Профессиональное обучение", sent: 1, ok: 0, rate: 0 },
      { program: "Содействие в трудоустройстве", sent: 1, ok: 1, rate: 100 },
      { program: "Программа поддержки бизнеса", sent: 1, ok: 1, rate: 100 },
      { program: "Возвращение к обучению", sent: 1, ok: 0, rate: 0 },
      { program: "Молодёжная стажировка", sent: 0, ok: 0, rate: 0 },
    ]);
  });

  it("помесячная динамика — 6 месяцев по формуле от routed/succeeded", async () => {
    const { monthly } = (await get("/api/stats/analytics", districtToken())).json();
    // routed = 4, succeeded = 2
    expect(monthly).toEqual([
      { month: "Март", routed: 3, employed: 1 },
      { month: "Апрель", routed: 4, employed: 2 },
      { month: "Май", routed: 3, employed: 1 },
      { month: "Июнь", routed: 3, employed: 3 },
      { month: "Июль", routed: 5, employed: 1 },
      { month: "Август", routed: 3, employed: 1 },
    ]);
  });

  it("для роли махалли воронка сужается до своей махалли", async () => {
    const { funnel, programs } = (
      await get("/api/stats/analytics", darkhanToken())
    ).json();
    expect(funnel.map((f: { value: number }) => f.value)).toEqual([5, 3, 2, 1]);
    expect(programs[0]).toEqual({
      program: "Профессиональное обучение",
      sent: 1,
      ok: 0,
      rate: 0,
    });
    // Программа бизнеса — в другой махалле, здесь ноль.
    expect(programs[2]).toEqual({
      program: "Программа поддержки бизнеса",
      sent: 0,
      ok: 0,
      rate: 0,
    });
  });

  it("без токена — 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/stats/analytics" });
    expect(res.statusCode).toBe(401);
  });
});
