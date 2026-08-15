import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  FIXTURE_NOW,
  FIXTURE_STALE,
  makeApp,
  seedFixture,
  tokenFor,
  truncateAll,
} from "./helpers.js";

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

// district_officer видит все махалли, mahalla_officer — только Дархан,
// employment_specialist — только направленных на программу.
const districtToken = () => tokenFor(app, { role: "district_officer", mahalla: null });
const darkhanToken = () => tokenFor(app, { role: "mahalla_officer", mahalla: "Дархан" });
const specialistToken = () =>
  tokenFor(app, { role: "employment_specialist", mahalla: null });

// TODAY считает БД (CURRENT_DATE в UTC-контейнере) — та же дата, что у фикстуры.
const TODAY = FIXTURE_NOW;

function mutate(
  method: "POST" | "PATCH",
  url: string,
  token: string,
  payload?: unknown,
) {
  return app.inject({
    method,
    url,
    headers: { authorization: `Bearer ${token}` },
    ...(payload === undefined ? {} : { payload: payload as object }),
  });
}

const routeToProgram = (id: string, token: string, payload?: unknown) =>
  mutate("POST", `/api/people/${id}/route-to-program`, token, payload);
const confirmStatus = (id: string, token: string) =>
  mutate("POST", `/api/people/${id}/confirm-status`, token, {});
const requestClarification = (id: string, token: string) =>
  mutate("POST", `/api/people/${id}/request-clarification`, token, {});
const setReviewStatus = (id: string, token: string, payload?: unknown) =>
  mutate("PATCH", `/api/people/${id}/review-status`, token, payload);

const lastEvent = (body: { history: Array<Record<string, unknown>> }) =>
  body.history[body.history.length - 1]!;

describe("POST /api/people/:id/route-to-program (п.8)", () => {
  it("проставляет программу, статус, исход и дату обновления", async () => {
    const res = await routeToProgram("Y-1002", districtToken(), {
      program: "Молодёжная стажировка",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe("Y-1002");
    expect(body.program).toBe("Молодёжная стажировка");
    expect(body.status).toBe("Направлен на программу");
    expect(body.outcome).toBe("В процессе");
    expect(body.neetReviewStatus).toBe("Подтверждено");
    // до мутации Y-1002 был просрочен (FIXTURE_STALE)
    expect(body.lastUpdate).toBe(TODAY);
    expect(body.programOutcome).toBe("Ожидает");
    expect(body.programRoutedAt).toBe(TODAY);
    expect(body.routedBy).toBe("Уполномоченный сотрудник районного хокимията");
  });

  it("добавляет событие истории с точным заголовком и комментарием", async () => {
    const res = await routeToProgram("Y-1002", districtToken(), {
      program: "Профессиональное обучение",
      comment: "Согласовано с махаллинским комитетом",
    });
    const body = res.json();
    // у Y-1002 в фикстуре 2 события, стало 3
    expect(body.history).toHaveLength(3);
    expect(lastEvent(body)).toEqual({
      date: TODAY,
      title: "Направлен на программу: Профессиональное обучение",
      note: "Согласовано с махаллинским комитетом",
      source: "программа",
    });
  });

  it("без комментария событие приходит без note", async () => {
    const res = await routeToProgram("Y-1002", districtToken(), {
      program: "Содействие в трудоустройстве",
    });
    expect(lastEvent(res.json()).note).toBeUndefined();
  });

  it("отвечает полным Person (поля модели + история)", async () => {
    const res = await routeToProgram("Y-1002", districtToken(), {
      program: "Возвращение к обучению",
    });
    const body = res.json();
    expect(body.mahalla).toBe("Дархан");
    expect(body.fullName).toBe("Рахимов Жасур угли");
    expect(Array.isArray(body.skills)).toBe(true);
    expect(Array.isArray(body.history)).toBe(true);
  });

  it("невалидная программа → 400", async () => {
    const res = await routeToProgram("Y-1002", districtToken(), {
      program: "Курсы кройки и шитья",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("пустое тело → 400", async () => {
    const res = await routeToProgram("Y-1002", districtToken(), {});
    expect(res.statusCode).toBe(400);
  });

  it("неизвестный id → 404", async () => {
    const res = await routeToProgram("Y-9999", districtToken(), {
      program: "Молодёжная стажировка",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("чужая махалля → 403 и запись не меняется", async () => {
    const res = await routeToProgram("Y-1005", darkhanToken(), {
      program: "Молодёжная стажировка",
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");

    const check = await app.inject({
      method: "GET",
      url: "/api/people/Y-1005",
      headers: { authorization: `Bearer ${districtToken()}` },
    });
    expect(check.json().program).toBeNull();
    expect(check.json().status).toBe("Учится");
  });

  it("специалисту по занятости виден только направленный на программу", async () => {
    const denied = await routeToProgram("Y-1002", specialistToken(), {
      program: "Молодёжная стажировка",
    });
    expect(denied.statusCode).toBe(403);

    // Y-1004 уже направлен — попадает в скоуп routed_only, программу можно сменить.
    const ok = await routeToProgram("Y-1004", specialistToken(), {
      program: "Программа поддержки бизнеса",
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().program).toBe("Программа поддержки бизнеса");
  });

  it("без токена → 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/people/Y-1002/route-to-program",
      payload: { program: "Молодёжная стажировка" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/people/:id/confirm-status (п.9)", () => {
  it("у NEET подтверждает проверку и обновляет дату", async () => {
    const res = await confirmStatus("Y-1002", darkhanToken());
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.neet).toBe(true);
    expect(body.neetReviewStatus).toBe("Подтверждено");
    expect(body.lastUpdate).toBe(TODAY);
    expect(lastEvent(body)).toEqual({
      date: TODAY,
      title: "Статус подтверждён сотрудником",
    });
  });

  it("у не-NEET не трогает neetReviewStatus, но обновляет дату и историю", async () => {
    const res = await confirmStatus("Y-1000", darkhanToken());
    const body = res.json();
    expect(body.neet).toBe(false);
    expect(body.neetReviewStatus).toBe("Флаг снят");
    expect(body.lastUpdate).toBe(TODAY);
    expect(body.history).toHaveLength(2);
    expect(lastEvent(body).title).toBe("Статус подтверждён сотрудником");
  });

  it("неизвестный id → 404", async () => {
    expect((await confirmStatus("Y-9999", districtToken())).statusCode).toBe(404);
  });

  it("чужая махалля → 403", async () => {
    expect((await confirmStatus("Y-1008", darkhanToken())).statusCode).toBe(403);
  });
});

describe("POST /api/people/:id/request-clarification (п.10)", () => {
  it("ставит «На уточнении» и НЕ меняет lastUpdate", async () => {
    const res = await requestClarification("Y-1002", darkhanToken());
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.neetReviewStatus).toBe("На уточнении");
    // Y-1002 в фикстуре просрочен — дата обновления должна остаться прежней.
    expect(body.lastUpdate).toBe(FIXTURE_STALE);
    expect(lastEvent(body)).toEqual({
      date: TODAY,
      title: "Запрошено уточнение данных",
    });
  });

  it("работает и для не-NEET (флаг проверки выставляется всем)", async () => {
    const body = (await requestClarification("Y-1000", darkhanToken())).json();
    expect(body.neetReviewStatus).toBe("На уточнении");
    expect(body.lastUpdate).toBe(FIXTURE_NOW);
  });

  it("неизвестный id → 404", async () => {
    expect((await requestClarification("Y-9999", districtToken())).statusCode).toBe(404);
  });

  it("чужая махалля → 403", async () => {
    expect((await requestClarification("Y-1005", darkhanToken())).statusCode).toBe(403);
  });
});

describe("PATCH /api/people/:id/review-status (п.11)", () => {
  it("выставляет статус проверки, обновляет дату и историю", async () => {
    const res = await setReviewStatus("Y-1002", districtToken(), {
      status: "Флаг снят",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.neetReviewStatus).toBe("Флаг снят");
    expect(body.lastUpdate).toBe(TODAY);
    expect(lastEvent(body)).toEqual({
      date: TODAY,
      title: "Проверка NEET: Флаг снят",
    });
  });

  it("принимает каждый из 4 review-статусов", async () => {
    for (const status of [
      "Ожидает проверки",
      "На уточнении",
      "Подтверждено",
      "Флаг снят",
    ]) {
      const res = await setReviewStatus("Y-1003", districtToken(), { status });
      expect(res.statusCode).toBe(200);
      expect(res.json().neetReviewStatus).toBe(status);
    }
  });

  it("невалидный статус → 400", async () => {
    const res = await setReviewStatus("Y-1002", districtToken(), {
      status: "Проверено дважды",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("пустое тело → 400", async () => {
    expect((await setReviewStatus("Y-1002", districtToken(), {})).statusCode).toBe(400);
  });

  it("неизвестный id → 404", async () => {
    const res = await setReviewStatus("Y-9999", districtToken(), {
      status: "Подтверждено",
    });
    expect(res.statusCode).toBe(404);
  });

  it("чужая махалля → 403 и статус проверки не меняется", async () => {
    const res = await setReviewStatus("Y-1005", darkhanToken(), {
      status: "Подтверждено",
    });
    expect(res.statusCode).toBe(403);

    const check = await app.inject({
      method: "GET",
      url: "/api/people/Y-1005",
      headers: { authorization: `Bearer ${districtToken()}` },
    });
    expect(check.json().neetReviewStatus).toBe("Флаг снят");
  });
});

describe("мутации и скоуп own_mahalla", () => {
  it("роль без махалли → 403", async () => {
    const token = tokenFor(app, { role: "mahalla_officer", mahalla: null });
    expect((await confirmStatus("Y-1000", token)).statusCode).toBe(403);
  });

  it("своя махалля доступна и представителю молодёжи", async () => {
    const token = tokenFor(app, { role: "youth_rep", mahalla: "Дархан" });
    const res = await routeToProgram("Y-1003", token, {
      program: "Возвращение к обучению",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().routedBy).toBe(
      "Представитель махалли по работе с молодёжью · Дархан",
    );
  });
});
