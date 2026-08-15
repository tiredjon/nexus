import type { FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";
import { resolveScope, roleNeedsMahalla } from "../src/lib/scope.js";
import type { SessionPayload } from "../src/plugins/auth.js";

// resolveScope читает только req.user, поэтому фейкового объекта достаточно.
function scopeFor(user: SessionPayload) {
  return resolveScope({ user } as unknown as FastifyRequest);
}

describe("resolveScope", () => {
  it("own_mahalla роли резолвятся в свою махаллю", () => {
    const s = scopeFor({ role: "mahalla_officer", mahalla: "Олтинтепа" });
    expect(s.kind).toBe("own_mahalla");
    expect(s.mahallaName).toBe("Олтинтепа");
    expect(s.mahallaId).toBe(3); // Олтинтепа = id 3
  });

  it("youth_rep тоже own_mahalla", () => {
    expect(scopeFor({ role: "youth_rep", mahalla: "Дархан" }).mahallaId).toBe(1);
  });

  it("district_officer видит все махалли", () => {
    const s = scopeFor({ role: "district_officer", mahalla: null });
    expect(s.kind).toBe("all_mahallas");
    expect(s.mahallaId).toBeNull();
  });

  it("employment_specialist → routed_only без привязки к махалле", () => {
    const s = scopeFor({ role: "employment_specialist", mahalla: null });
    expect(s.kind).toBe("routed_only");
    expect(s.mahallaId).toBeNull();
  });

  it("admin → all_data", () => {
    expect(scopeFor({ role: "admin", mahalla: null }).kind).toBe("all_data");
  });

  it("roleNeedsMahalla только для own_mahalla ролей", () => {
    expect(roleNeedsMahalla("mahalla_officer")).toBe(true);
    expect(roleNeedsMahalla("youth_rep")).toBe(true);
    expect(roleNeedsMahalla("district_officer")).toBe(false);
    expect(roleNeedsMahalla("employment_specialist")).toBe(false);
    expect(roleNeedsMahalla("admin")).toBe(false);
  });
});
