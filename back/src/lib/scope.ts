import type { FastifyRequest } from "fastify";
import { MAHALLA_ID_BY_NAME, type Mahalla } from "../db/constants.js";

// Скоуп запроса, выведенный из JWT. district видит всех (mahallaId = null),
// mahalla-роль привязана к своей махалле по id. Единый источник правды по
// доступу — helper resolveScope; списки/мутации строят WHERE от него.
export type Scope = {
  role: "district" | "mahalla";
  mahallaName: string | null;
  mahallaId: number | null;
};

export function resolveScope(req: FastifyRequest): Scope {
  const { role, mahalla } = req.user;
  if (role === "mahalla") {
    return {
      role,
      mahallaName: mahalla,
      mahallaId: mahalla ? (MAHALLA_ID_BY_NAME[mahalla as Mahalla] ?? null) : null,
    };
  }
  return { role: "district", mahallaName: null, mahallaId: null };
}
