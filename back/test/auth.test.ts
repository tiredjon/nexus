import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  GENDERS,
  OUTCOMES,
  PROGRAMS,
  REVIEW_STATUSES,
  STATUSES,
} from "../src/db/constants.js";
import { makeApp, seedMahallas, tokenFor, truncateAll } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await truncateAll();
  await seedMahallas();
});

describe("POST /api/auth/login", () => {
  it("district-логин выдаёт токен и сессию", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "district" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.token).toBe("string");
    expect(body.session).toEqual({ role: "district", mahalla: null });
  });

  it("mahalla-логин привязан к своей махалле", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla", mahalla: "Дархан" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().session).toEqual({ role: "mahalla", mahalla: "Дархан" });
  });

  it("неизвестная махалля → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla", mahalla: "Несуществующая" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("mahalla-роль без имени махалли → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("mahalla указана без роли mahalla → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "district", mahalla: "Дархан" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("невалидная роль → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("round-trip: логин → me возвращает ту же сессию", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla", mahalla: "Салар" },
    });
    const token = login.json().token;
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual({ role: "mahalla", mahalla: "Салар" });
  });

  it("без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });
});

describe("meta", () => {
  it("GET /api/meta/mahallas → 12 махаллей по порядку id", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/meta/mahallas",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json();
    expect(items).toHaveLength(12);
    expect(items[0]).toEqual({ id: 1, name: "Дархан", lat: 41.3455, lng: 69.3105 });
    expect(items.map((m: { id: number }) => m.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("GET /api/meta/mahallas без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/meta/mahallas" });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/meta/dictionaries → все справочники", async () => {
    const token = tokenFor(app, { role: "district", mahalla: null });
    const res = await app.inject({
      method: "GET",
      url: "/api/meta/dictionaries",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.statuses).toEqual([...STATUSES]);
    expect(body.reviewStatuses).toEqual([...REVIEW_STATUSES]);
    expect(body.programs).toEqual([...PROGRAMS]);
    expect(body.genders).toEqual([...GENDERS]);
    expect(body.outcomes).toEqual([...OUTCOMES]);
  });
});
