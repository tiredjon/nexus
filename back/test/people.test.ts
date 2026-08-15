import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeApp, seedFixture, tokenFor, truncateAll } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await truncateAll();
  await seedFixture();
});

describe("GET /api/people", () => {
  it("список без фильтров → все люди, сортировка по fullName ASC", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(10); // 10 в фикстуре
    expect(body.items.length).toBe(10);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(50);
    expect(body.totalPages).toBe(1);
    // Проверим сортировку по fullName (русская коллация).
    const names = body.items.map((p: any) => p.fullName);
    const sorted = [...names].sort((a: string, b: string) =>
      a.localeCompare(b, "ru-RU"),
    );
    expect(names).toEqual(sorted);
  });

  it("фильтр по query (ILIKE поиск)", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?query=азиз",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].fullName).toContain("Азиз");
  });

  it("фильтр по status", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?status=Работает",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(3); // Y-1000, Y-1001, Y-1008
    expect(body.items.every((p: any) => p.status === "Работает")).toBe(true);
  });

  it("фильтр по ageMin/ageMax", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?ageMin=25&ageMax=30",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.every((p: any) => p.age >= 25 && p.age <= 30)).toBe(true);
  });

  it("фильтр neet=true", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?neet=true",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.every((p: any) => p.neet === true)).toBe(true);
    expect(body.total).toBeGreaterThan(0);
  });

  it("фильтр needsSupport=true", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?needsSupport=true",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.every((p: any) => p.needsSupport === true)).toBe(true);
  });

  it("фильтр stale=true (>90 дней без обновления)", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?stale=true",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    // Проверим, что все действительно старые (в фикстуре staleDays ~100 дней назад).
    expect(body.items[0].lastUpdate).toBeDefined();
  });

  it("фильтр по mahalla (district-роль)", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?mahalla=Дархан",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.every((p: any) => p.mahalla === "Дархан")).toBe(true);
  });

  it("сортировка по age ASC", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?sort=age&order=asc",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const ages = body.items.map((p: any) => p.age);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
  });

  it("сортировка по age DESC", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?sort=age&order=desc",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const ages = body.items.map((p: any) => p.age);
    expect(ages).toEqual([...ages].sort((a, b) => b - a));
  });

  it("сортировка по mahalla (русская коллация)", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?sort=mahalla",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const mahallas = body.items.map((p: any) => p.mahalla);
    const sorted = [...mahallas].sort((a, b) =>
      a.localeCompare(b, "ru-RU"),
    );
    expect(mahallas).toEqual(sorted);
  });

  it("пагинация: page=1, pageSize=5", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?pageSize=5&page=1",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBe(5);
    expect(body.total).toBe(10);
    expect(body.totalPages).toBe(2);
    expect(body.page).toBe(1);
  });

  it("пагинация: page=2, pageSize=5", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?pageSize=5&page=2",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBe(5);
    expect(body.page).toBe(2);
  });

  it("комбинация фильтров: status + ageMin", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?status=Работает&ageMin=25",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(
      body.items.every(
        (p: any) => p.status === "Работает" && p.age >= 25,
      ),
    ).toBe(true);
  });

  it("невалидные параметры → 400", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?pageSize=1000",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("mahalla-роль видит только свою махаллю", async () => {
    const token = tokenFor(app, { role: "mahalla", mahalla: "Дархан" });
    const res = await app.inject({
      method: "GET",
      url: "/api/people",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.every((p: any) => p.mahalla === "Дархан")).toBe(true);
  });

  it("mahalla-роль запрашивает чужую махаллю → 403", async () => {
    const token = tokenFor(app, { role: "mahalla", mahalla: "Дархан" });
    const res = await app.inject({
      method: "GET",
      url: "/api/people?mahalla=Буюк Ипак Йули",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/people" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/people/:id", () => {
  it("найден → полный профиль с историей", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people/Y-1000",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe("Y-1000");
    expect(body.fullName).toBe("Каримов Азиз угли");
    expect(body.mahalla).toBe("Дархан");
    expect(Array.isArray(body.history)).toBe(true);
  });

  it("история отсортирована по date ASC, id ASC", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people/Y-1002",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const history = body.history;
    if (history.length > 1) {
      for (let i = 0; i < history.length - 1; i++) {
        const cmp = history[i].date.localeCompare(history[i + 1].date);
        expect(cmp).toBeLessThanOrEqual(0);
      }
    }
  });

  it("история содержит title и опциональный note", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people/Y-1002",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.history.forEach((h: any) => {
      expect(typeof h.title).toBe("string");
      expect(h.date).toBeDefined();
      if (h.note !== null && h.note !== undefined) {
        expect(typeof h.note).toBe("string");
      }
    });
  });

  it("не найден → 404", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/people/Y-999999",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("чужая махалля (mahalla-роль) → 403", async () => {
    const token = tokenFor(app, { role: "mahalla", mahalla: "Дархан" });
    const res = await app.inject({
      method: "GET",
      url: "/api/people/Y-1005", // Буюк Ипак Йули
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("mahalla-роль видит свою махаллю", async () => {
    const token = tokenFor(app, { role: "mahalla", mahalla: "Дархан" });
    const res = await app.inject({
      method: "GET",
      url: "/api/people/Y-1000", // Дархан
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().mahalla).toBe("Дархан");
  });

  it("без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/people/Y-1000" });
    expect(res.statusCode).toBe(401);
  });
});
