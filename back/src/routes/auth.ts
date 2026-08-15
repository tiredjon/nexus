import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAHALLAS, type Mahalla } from "../db/constants.js";
import { httpError } from "../lib/errors.js";
import type { SessionPayload } from "../plugins/auth.js";

const MAHALLA_SET = new Set<string>(MAHALLAS);

const LoginSchema = z.object({
  role: z.enum(["district", "mahalla"]),
  mahalla: z.string().optional().nullable(),
});

// пп.2–3: логин выдаёт JWT под сессию, /me возвращает текущую сессию.
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", async (req) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError("BAD_REQUEST", "Некорректное тело запроса");
    }
    const { role } = parsed.data;
    const mahalla = parsed.data.mahalla ?? null;

    if (role === "mahalla") {
      if (!mahalla || !MAHALLA_SET.has(mahalla)) {
        throw httpError("BAD_REQUEST", "Неизвестная махалля");
      }
    } else if (mahalla !== null) {
      // mahalla указана без роли mahalla — это ошибка (backend.md п.2).
      throw httpError("BAD_REQUEST", "Параметр mahalla допустим только для роли mahalla");
    }

    const session: SessionPayload = {
      role,
      mahalla: role === "mahalla" ? (mahalla as Mahalla) : null,
    };
    const token = app.jwt.sign(session);
    return { token, session };
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (req) => {
    const { role, mahalla } = req.user;
    return { role, mahalla };
  });
}
