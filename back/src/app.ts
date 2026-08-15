import Fastify, { type FastifyInstance } from "fastify";
import { registerErrorHandler } from "./lib/errors.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { metaRoutes } from "./routes/meta.js";
import { peopleRoutes } from "./routes/people.js";

// buildApp() собирает приложение без listen() — тесты гоняют его через
// app.inject(), а index.ts поднимает сеть отдельно.
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === "production",
  });

  registerErrorHandler(app);
  await app.register(authPlugin);

  // /health вне /api и без auth.
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(metaRoutes, { prefix: "/api" });
  await app.register(peopleRoutes, { prefix: "/api" });

  return app;
}
