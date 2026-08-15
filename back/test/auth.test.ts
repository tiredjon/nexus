import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  DESIRED_DIRECTIONS,
  EDUCATION_LEVELS,
  GENDERS,
  MARITAL_STATUSES,
  OUTCOMES,
  PROGRAM_OUTCOMES,
  PROGRAMS,
  REVIEW_STATUSES,
  STATUSES,
  UPDATE_SOURCES,
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
  it("district_officer логинится без махалли", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "district_officer" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.token).toBe("string");
    expect(body.session).toEqual({ role: "district_officer", mahalla: null });
  });

  it("mahalla_officer привязан к своей махалле", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla_officer", mahalla: "Дархан" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().session).toEqual({ role: "mahalla_officer", mahalla: "Дархан" });
  });

  it("youth_rep тоже требует махаллю", async () => {
    const ok = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "youth_rep", mahalla: "Салар" },
    });
    expect(ok.statusCode).toBe(200);
    const bad = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "youth_rep" },
    });
    expect(bad.statusCode).toBe(400);
  });

  it("employment_specialist и admin логинятся без махалли", async () => {
    for (const role of ["employment_specialist", "admin"]) {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { role },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().session).toEqual({ role, mahalla: null });
    }
  });

  it("неизвестная махалля → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla_officer", mahalla: "Несуществующая" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("own_mahalla-роль без махалли → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "mahalla_officer" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("махалля указана роли, которой она не положена → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "district_officer", mahalla: "Дархан" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("невалидная роль → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "superuser" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("round-trip: логин → me возвращает ту же сессию", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { role: "youth_rep", mahalla: "Салар" },
    });
    const token = login.json().token;
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual({ role: "youth_rep", mahalla: "Салар" });
  });

  it("без токена → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });
});

describe("meta", () => {
  it("GET /api/meta/mahallas → 12 махаллей по порядку id", async () => {
    const token = tokenFor(app, { role: "district_officer", mahalla: null });
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
    const token = tokenFor(app, { role: "admin", mahalla: null });
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
    expect(body.programOutcomes).toEqual([...PROGRAM_OUTCOMES]);
    expect(body.genders).toEqual([...GENDERS]);
    expect(body.outcomes).toEqual([...OUTCOMES]);
    expect(body.educationLevels).toEqual([...EDUCATION_LEVELS]);
    expect(body.desiredDirections).toEqual([...DESIRED_DIRECTIONS]);
    expect(body.updateSources).toEqual([...UPDATE_SOURCES]);
    expect(body.maritalStatuses).toEqual([...MARITAL_STATUSES]);
  });
});
