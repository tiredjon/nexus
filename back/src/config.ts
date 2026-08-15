import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3001),
  // Вне production допускаем дефолтный секрет — так локальный запуск и CI не
  // требуют лишней настройки. В production секрет обязателен.
  JWT_SECRET: isProd ? z.string().min(1) : z.string().min(1).default("dev-secret"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Некорректные переменные окружения:\n${issues}`);
}

export const config = parsed.data;
