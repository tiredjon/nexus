import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAHALLAS, type Mahalla } from "../db/constants.js";
import { httpError } from "../lib/errors.js";
import { ROLES, roleNeedsMahalla } from "../lib/scope.js";
import type { SessionPayload } from "../plugins/auth.js";

const MAHALLA_SET = new Set<string>(MAHALLAS);

const LoginSchema = z.object({
  role: z.enum(ROLES),
  mahalla: z.string().optional().nullable(),
});

// пп.2–3: логин выдаёт JWT под сессию, /me возвращает текущую сессию. role —
// одна из 5 ролей фронта; own_mahalla-роли требуют валидную махаллю, остальным
// махалля не положена.
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", async (req) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError("BAD_REQUEST", "Некорректное тело запроса");
    }
    const { role } = parsed.data;
    const mahalla = parsed.data.mahalla ?? null;

    if (roleNeedsMahalla(role)) {
      if (!mahalla || !MAHALLA_SET.has(mahalla)) {
        throw httpError("BAD_REQUEST", "Для этой роли нужна корректная махалля");
      }
    } else if (mahalla !== null) {
      throw httpError("BAD_REQUEST", "Этой роли махалля не назначается");
    }

    const session: SessionPayload = {
      role,
      mahalla: roleNeedsMahalla(role) ? (mahalla as Mahalla) : null,
    };
    const token = app.jwt.sign(session);
    return { token, session };
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (req) => {
    const { role, mahalla } = req.user;
    return { role, mahalla };
  });
}
