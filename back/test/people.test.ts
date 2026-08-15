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

// district_officer → all_mahallas: видит всю фикстуру.
const districtToken = () =>
  tokenFor(app, { role: "district_officer", mahalla: null });
// mahalla_officer → own_mahalla: только своя махалля.
const darkhanToken = () =>
  tokenFor(app, { role: "mahalla_officer", mahalla: "Дархан" });

async function list(url: string, token: string) {
  return app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}` } });
}

describe("GET /api/people — фильтры", () => {
  it("без фильтров отдаёт всю фикстуру и метаданные пагинации", async () => {
    const res = await list("/api/people", districtToken());
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(10);
    expect(body.items).toHaveLength(10);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(50);
    expect(body.totalPages).toBe(1);
  });

  it("элемент списка содержит поля новой модели и mahalla именем", async () => {
    const res = await list("/api/people?query=Каримов", districtToken());
    const item = res.json().items[0];
    expect(item.id).toBe("Y-1000");
    expect(item.mahalla).toBe("Дархан");
    expect(item.lastName).toBe("Каримов");
    expect(item.birthDate).toBeDefined();
    expect(Array.isArray(item.skills)).toBe(true);
    expect(Array.isArray(item.languages)).toBe(true);
    expect(item.desiredDirection).toBe("Трудоустройство");
    // history только в карточке одного человека (backend.md §3).
    expect(item.history).toBeUndefined();
  });

  it("query ищет подстроку без учёта регистра", async () => {
    const res = await list("/api/people?query=рАхИмОв", districtToken());
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].id).toBe("Y-1002");
  });

  it("status фильтрует по точному статусу", async () => {
    const res = await list("/api/people?status=Работает", districtToken());
    const body = res.json();
    expect(body.total).toBe(3); // Y-1000, Y-1001, Y-1008
    expect(body.items.every((p: { status: string }) => p.status === "Работает")).toBe(true);
  });

  it("ageMin/ageMax сужают диапазон возраста", async () => {
    const res = await list("/api/people?ageMin=28&ageMax=30", districtToken());
    const body = res.json();
    expect(body.total).toBe(3); // 28, 30, 29
    expect(body.items.every((p: { age: number }) => p.age >= 28 && p.age <= 30)).toBe(true);
  });

  it("neet=true отдаёт только NEET", async () => {
    const res = await list("/api/people?neet=true", districtToken());
    const body = res.json();
    expect(body.total).toBe(3); // Y-1002, Y-1003, Y-1004
    expect(body.items.every((p: { neet: boolean }) => p.neet)).toBe(true);
  });

  it("needsSupport=true отдаёт только нуждающихся в поддержке", async () => {
    const res = await list("/api/people?needsSupport=true", districtToken());
    const body = res.json();
    expect(body.total).toBe(2); // Y-1002, Y-1004
    expect(body.items.every((p: { needsSupport: boolean }) => p.needsSupport)).toBe(true);
  });

  it("stale=true отдаёт тех, кого не обновляли больше 90 дней", async () => {
    const res = await list("/api/people?stale=true", districtToken());
    const body = res.json();
    expect(body.total).toBe(2); // Y-1002, Y-1006
    expect(body.items.map((p: { id: string }) => p.id).sort()).toEqual(["Y-1002", "Y-1006"]);
  });

  it("mahalla сужает выборку для роли, видящей все махалли", async () => {
    const res = await list("/api/people?mahalla=Буюк Ипак Йули", districtToken());
    const body = res.json();
    expect(body.total).toBe(3); // Y-1005..Y-1007
    expect(body.items.every((p: { mahalla: string }) => p.mahalla === "Буюк Ипак Йули")).toBe(
      true,
    );
  });

  it("фильтры комбинируются через AND", async () => {
    const res = await list("/api/people?mahalla=Дархан&neet=true&needsSupport=true", districtToken());
    const body = res.json();
    expect(body.total).toBe(2); // Y-1002, Y-1004
  });

  it("неизвестная махалля → 400", async () => {
    const res = await list("/api/people?mahalla=Несуществующая", districtToken());
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("pageSize вне допустимого диапазона → 400", async () => {
    const res = await list("/api/people?pageSize=1000", districtToken());
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("ageMin больше ageMax → 400", async () => {
    const res = await list("/api/people?ageMin=30&ageMax=18", districtToken());
    expect(res.statusCode).toBe(400);
  });

  it("невалидный sort → 400", async () => {
    const res = await list("/api/people?sort=id", districtToken());
    expect(res.statusCode).toBe(400);
  });

  it("без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/people" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });
});

describe("GET /api/people — сортировка и пагинация", () => {
  it("sort=fullName order=asc — по возрастанию русской коллацией", async () => {
    const res = await list("/api/people?sort=fullName&order=asc", districtToken());
    const names = res.json().items.map((p: { fullName: string }) => p.fullName);
    expect(names).toEqual([...names].sort((a: string, b: string) => a.localeCompare(b, "ru")));
  });

  it("sort=fullName order=desc — зеркальный порядок", async () => {
    const asc = await list("/api/people?sort=fullName&order=asc", districtToken());
    const desc = await list("/api/people?sort=fullName&order=desc", districtToken());
    const ascIds = asc.json().items.map((p: { id: string }) => p.id);
    const descIds = desc.json().items.map((p: { id: string }) => p.id);
    expect(descIds).toEqual([...ascIds].reverse());
  });

  it("sort=age работает в обе стороны", async () => {
    const asc = await list("/api/people?sort=age&order=asc", districtToken());
    const desc = await list("/api/people?sort=age&order=desc", districtToken());
    const ascAges = asc.json().items.map((p: { age: number }) => p.age);
    const descAges = desc.json().items.map((p: { age: number }) => p.age);
    expect(ascAges).toEqual([...ascAges].sort((a: number, b: number) => a - b));
    expect(descAges).toEqual([...descAges].sort((a: number, b: number) => b - a));
    expect(ascAges[0]).toBe(18);
    expect(descAges[0]).toBe(30);
  });

  it("sort=mahalla сортирует по имени махалли", async () => {
    const res = await list("/api/people?sort=mahalla&order=asc", districtToken());
    const names = res.json().items.map((p: { mahalla: string }) => p.mahalla);
    expect(names).toEqual([...names].sort((a: string, b: string) => a.localeCompare(b, "ru")));
  });

  it("sort=lastUpdate ставит самых старых первыми при asc", async () => {
    const res = await list("/api/people?sort=lastUpdate&order=asc", districtToken());
    const dates = res.json().items.map((p: { lastUpdate: string }) => p.lastUpdate);
    expect(dates).toEqual([...dates].sort());
  });

  it("страницы не пересекаются и покрывают всю выборку", async () => {
    const p1 = await list("/api/people?pageSize=4&page=1", districtToken());
    const p2 = await list("/api/people?pageSize=4&page=2", districtToken());
    const p3 = await list("/api/people?pageSize=4&page=3", districtToken());

    expect(p1.json().totalPages).toBe(3);
    expect(p1.json().items).toHaveLength(4);
    expect(p2.json().items).toHaveLength(4);
    expect(p3.json().items).toHaveLength(2);

    const ids = [
      ...p1.json().items.map((p: { id: string }) => p.id),
      ...p2.json().items.map((p: { id: string }) => p.id),
      ...p3.json().items.map((p: { id: string }) => p.id),
    ];
    expect(new Set(ids).size).toBe(10);
  });

  it("страница за пределами выборки отдаёт пустой items, но верный total", async () => {
    const res = await list("/api/people?page=99", districtToken());
    const body = res.json();
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(10);
  });

  it("total считается по фильтру, а не по странице", async () => {
    const res = await list("/api/people?neet=true&pageSize=1", districtToken());
    const body = res.json();
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(3);
    expect(body.totalPages).toBe(3);
  });
});

describe("GET /api/people — скоуп по ролям", () => {
  it("mahalla_officer видит только свою махаллю без параметров", async () => {
    const res = await list("/api/people", darkhanToken());
    const body = res.json();
    expect(body.total).toBe(5); // Y-1000..Y-1004
    expect(body.items.every((p: { mahalla: string }) => p.mahalla === "Дархан")).toBe(true);
  });

  it("mahalla_officer со своей махаллёй в параметре — тот же результат", async () => {
    const res = await list("/api/people?mahalla=Дархан", darkhanToken());
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBe(5);
  });

  it("mahalla_officer просит чужую махаллю → 403", async () => {
    const res = await list("/api/people?mahalla=Олтинтепа", darkhanToken());
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("youth_rep скоупится так же, как mahalla_officer", async () => {
    const token = tokenFor(app, { role: "youth_rep", mahalla: "Олтинтепа" });
    const res = await list("/api/people", token);
    expect(res.json().total).toBe(2); // Y-1008, Y-1009
  });

  it("employment_specialist видит только направленных на программу", async () => {
    const token = tokenFor(app, { role: "employment_specialist", mahalla: null });
    const res = await list("/api/people", token);
    const body = res.json();
    expect(body.total).toBe(1); // только Y-1004
    expect(body.items[0].id).toBe("Y-1004");
  });

  it("admin видит всю выборку", async () => {
    const token = tokenFor(app, { role: "admin", mahalla: null });
    const res = await list("/api/people", token);
    expect(res.json().total).toBe(10);
  });

  it("скоуп применяется вместе с остальными фильтрами", async () => {
    const res = await list("/api/people?neet=true", darkhanToken());
    const body = res.json();
    expect(body.total).toBe(3); // все NEET фикстуры и так в Дархане
    expect(body.items.every((p: { mahalla: string }) => p.mahalla === "Дархан")).toBe(true);
  });
});

describe("GET /api/people/:id", () => {
  it("отдаёт полный профиль с историей", async () => {
    const res = await list("/api/people/Y-1004", districtToken());
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe("Y-1004");
    expect(body.mahalla).toBe("Дархан");
    expect(body.program).toBe("Профессиональное обучение");
    expect(body.programOutcome).toBe("Приступил");
    expect(body.routedBy).toBe("Специалист по занятости");
    expect(body.history).toHaveLength(1);
  });

  it("история отсортирована по дате по возрастанию", async () => {
    const res = await list("/api/people/Y-1002", districtToken());
    const history = res.json().history;
    expect(history).toHaveLength(2);
    expect(history.map((h: { title: string }) => h.title)).toEqual([
      "Собеседование с инспектором махалли", // FIXTURE_STALE — раньше
      "Статус подтверждён сотрудником", // FIXTURE_NOW — позже
    ]);
    expect(history[0].note).toBe("Комментарий инспектора");
  });

  it("человек без истории отдаёт пустой массив", async () => {
    const res = await list("/api/people/Y-1005", districtToken());
    expect(res.statusCode).toBe(200);
    expect(res.json().history).toEqual([]);
  });

  it("неизвестный id → 404", async () => {
    const res = await list("/api/people/Y-999999", districtToken());
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("mahalla_officer видит человека своей махалли", async () => {
    const res = await list("/api/people/Y-1000", darkhanToken());
    expect(res.statusCode).toBe(200);
    expect(res.json().mahalla).toBe("Дархан");
  });

  it("mahalla_officer не видит человека чужой махалли → 403", async () => {
    const res = await list("/api/people/Y-1005", darkhanToken()); // Буюк Ипак Йули
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("employment_specialist не видит ненаправленного → 403", async () => {
    const token = tokenFor(app, { role: "employment_specialist", mahalla: null });
    const res = await list("/api/people/Y-1000", token); // program IS NULL
    expect(res.statusCode).toBe(403);
  });

  it("employment_specialist видит направленного", async () => {
    const token = tokenFor(app, { role: "employment_specialist", mahalla: null });
    const res = await list("/api/people/Y-1004", token);
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe("Y-1004");
  });

  it("без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/people/Y-1000" });
    expect(res.statusCode).toBe(401);
  });
});
