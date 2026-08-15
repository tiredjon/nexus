import type { FastifyRequest } from "fastify";
import { MAHALLA_ID_BY_NAME, type Mahalla } from "../db/constants.js";

// Роли и их зоны видимости — зеркало front/src/lib/permissions.ts. JWT несёт
// именно роль фронта; бэкенд выводит из неё scope.
export const ROLES = [
  "mahalla_officer",
  "youth_rep",
  "district_officer",
  "employment_specialist",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

// own_mahalla  — только своя махалля (нужен выбор махалли при логине)
// all_mahallas — все махалли, сводные показатели
// routed_only  — все махалли, но только направленные на программу (program IS NOT NULL)
// all_data     — всё без ограничений (демо-админ)
export type ScopeKind = "own_mahalla" | "all_mahallas" | "routed_only" | "all_data";

export const ROLE_SCOPE: Record<Role, ScopeKind> = {
  mahalla_officer: "own_mahalla",
  youth_rep: "own_mahalla",
  district_officer: "all_mahallas",
  employment_specialist: "routed_only",
  admin: "all_data",
};

export function roleNeedsMahalla(role: Role): boolean {
  return ROLE_SCOPE[role] === "own_mahalla";
}

export type Scope = {
  role: Role;
  kind: ScopeKind;
  mahallaName: string | null;
  mahallaId: number | null;
};

// Единый источник правды по доступу. Списки/мутации строят WHERE от scope:
// own_mahalla → фильтр по mahallaId; routed_only → program IS NOT NULL;
// all_mahallas/all_data → без ограничений.
export function resolveScope(req: FastifyRequest): Scope {
  const { role, mahalla } = req.user;
  const kind = ROLE_SCOPE[role];
  const mahallaId =
    kind === "own_mahalla" && mahalla
      ? (MAHALLA_ID_BY_NAME[mahalla as Mahalla] ?? null)
      : null;
  return {
    role,
    kind,
    mahallaName: kind === "own_mahalla" ? mahalla : null,
    mahallaId,
  };
}
