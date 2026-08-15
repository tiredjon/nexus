import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { config } from "../config.js";

// JWT payload — совпадает с yr-session фронта: mahalla это имя махалли (или null
// для district-роли). TTL 12 часов.
export type SessionPayload = {
  role: "district" | "mahalla";
  mahalla: string | null;
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionPayload;
    user: SessionPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Регистрирует @fastify/jwt и preHandler `authenticate`. Ошибку верификации
// прокидываем как есть — errorHandler маппит statusCode 401 в UNAUTHORIZED.
async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: "12h" },
  });

  app.decorate("authenticate", async (req: FastifyRequest, _reply: FastifyReply) => {
    await req.jwtVerify();
  });
}

export default fp(authPlugin);
