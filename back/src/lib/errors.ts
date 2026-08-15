import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL: 500,
};

// Форма ошибки везде одинаковая: { "error": { "code", "message" } }.
export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
  }
}

export function httpError(code: ErrorCode, message: string): HttpError {
  return new HttpError(code, message);
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof HttpError) {
      reply.status(err.statusCode).send({
        error: { code: err.code, message: err.message },
      });
      return;
    }

    // Ошибки JWT-плагина приходят с statusCode 401.
    if ((err as { statusCode?: number }).statusCode === 401) {
      reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Требуется авторизация" },
      });
      return;
    }

    app.log.error(err);
    reply.status(500).send({
      error: { code: "INTERNAL", message: "Внутренняя ошибка сервера" },
    });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Маршрут не найден" },
    });
  });
}
