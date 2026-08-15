import Fastify, { type FastifyInstance } from "fastify";
import { registerErrorHandler } from "./lib/errors.js";
import { healthRoutes } from "./routes/health.js";

// buildApp() собирает приложение без listen() — тесты гоняют его через
// app.inject(), а index.ts поднимает сеть отдельно.
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === "production",
  });

  registerErrorHandler(app);

  await app.register(healthRoutes);

  return app;
}
