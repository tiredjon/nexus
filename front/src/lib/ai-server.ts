// Серверная обёртка над LLM. Единственное место, где живёт API-ключ — тело
// .handler() исполняется только на сервере и вырезается из клиентского бандла,
// поэтому ключ в браузер не утекает.
//
// Провайдер — Google Gemini (generativelanguage API). Ключ передаётся заголовком
// x-goog-api-key: как Bearer-токен тот же ключ отдаёт 401 API_KEY_SERVICE_BLOCKED
// — API ждёт в Authorization именно OAuth-токен, а не ключ.
//
// ВАЖНО про хостинг: Google блокирует Gemini по стране egress-IP («User location
// is not supported»), поэтому с российского прод-сервера он не ответит. Локально
// и на зарубежном хостинге (Vercel) работает. Если прод вернётся в РФ — нужен
// либо прокси, либо провайдер вроде DeepSeek (прошлая реализация в git-истории).
import { createServerFn } from "@tanstack/react-start";

export type AiInput = {
  prompt: string;
  /** true → responseMimeType application/json: модель возвращает валидный JSON. */
  json?: boolean;
  /** 0 — детерминированно (разбор заметки), выше — «живее» (справка/сводка). */
  temperature?: number;
  /** Подмножество OpenAPI-схемы (объекты SCHEMA_* в ai.ts). Уходит в Gemini как
   *  responseSchema и жёстко фиксирует форму ответа: поля не теряются, и код не
   *  сваливается в фолбэк из-за неполного JSON. Работает только вместе с json. */
  schema?: unknown;
};

// gemini-3.7-flash — свежая и быстрая; gemini-2.5-flash стабильнее, если 3.x
// начнёт капризничать. Обе проверены в JSON-режиме этим ключом.
const DEFAULT_MODEL = "gemini-3.7-flash";
// v1alpha, а не v1beta: модели 3.x на v1beta отдают 404, на v1alpha работают
// (2.5-flash доступна на обеих). Одна версия для всех моделей проще развилки.
const API_VERSION = "v1alpha";
const endpointFor = (model: string) =>
  `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent`;

// Замеры на gemini-3.7-flash: самая тяжёлая фича (официальная справка,
// 6 разделов) отвечает за 6–7 с, объяснение рекомендации — за 3.5 с. 20 с —
// запас втрое; ждать дольше смысла нет, лучше быстро показать фолбэк.
const REQUEST_TIMEOUT_MS = 20_000;
// Потолок на ВСЕ попытки вместе. Функция на Vercel живёт maxDuration секунд
// (60, см. vite.config.ts) и при их исчерпании убивается — фолбэк выполниться
// не успеет, и пользователь увидит вечный спиннер вместо заглушки. Поэтому
// укладываемся заведомо раньше: 45 с на весь цикл ретраев.
const TOTAL_BUDGET_MS = 45_000;
// Токены «мышления» расходуют тот же бюджет, что и вывод, поэтому запас большой:
// на самой длинной справке (6 разделов) хватает и на размышление, и на JSON.
const MAX_TOKENS = 8192;

let cachedKey: string | null = null;

// Ключ берём из process.env (nitro/node подхватывают .env). Если переменной нет
// (иной раннер dev-сервера) — один раз читаем .env с диска. fs импортируется
// лениво, чтобы не тянуть node-модуль в клиентский граф.
async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  const fromEnv = (process.env["GEMINI_API_KEY"] ?? "").trim();
  if (fromEnv) {
    cachedKey = fromEnv;
    return cachedKey;
  }

  try {
    const { readFileSync } = await import("node:fs");
    const raw = readFileSync(new URL("../../.env", import.meta.url), "utf8");
    const line = raw.split(/\r?\n/).find((l) => l.startsWith("GEMINI_API_KEY="));
    if (line) {
      cachedKey = line.slice("GEMINI_API_KEY=".length).trim();
      return cachedKey;
    }
  } catch {
    // нет доступа к fs (edge) или файла нет — оставляем пустую строку
  }

  cachedKey = "";
  return cachedKey;
}

function getModel(): string {
  return (process.env["GEMINI_MODEL"] ?? "").trim() || DEFAULT_MODEL;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type GeminiPart = { text?: string; thought?: boolean };

async function callGemini(
  key: string,
  model: string,
  input: AiInput,
  signal: AbortSignal,
): Promise<string> {
  const body = {
    contents: [{ role: "user", parts: [{ text: input.prompt }] }],
    generationConfig: {
      temperature: input.temperature ?? 0.4,
      maxOutputTokens: MAX_TOKENS,
      // application/json заставляет модель вернуть валидный JSON, а
      // responseSchema фиксирует его форму на стороне Gemini. Схема ещё и
      // ускоряет ответ (модели меньше нужно «думать» над структурой): замер на
      // сводке — 2.8 с со схемой против 6–7 с без неё.
      ...(input.json
        ? {
            responseMimeType: "application/json",
            ...(input.schema ? { responseSchema: input.schema } : {}),
          }
        : {}),
    },
  };

  const res = await fetch(endpointFor(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Именно x-goog-api-key. В Authorization: Bearer тот же ключ → 401.
      "x-goog-api-key": key,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`gemini ${res.status}: ${detail.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    // Наблюдаемая флейкота: GFE изредка отдаёт 404 с пустым телом на запрос,
    // который в следующую секунду проходит. Настоящий «нет такой модели» —
    // это 404 с JSON-телом ошибки. Помечаем пустой как транзиентный, чтобы
    // ретрай его вытянул и фича не свалилась в мок из-за случайного сбоя.
    (err as Error & { transient?: boolean }).transient = !detail.trim();
    throw err;
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  };

  const candidate = data.candidates?.[0];
  // Части с thought: true — это «мышление» модели, а не ответ; берём только
  // обычный текст, иначе размышления попадут в JSON.parse и всё сломают.
  const text = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");

  if (!text.trim()) {
    // MAX_TOKENS здесь значит, что бюджет съело мышление и до ответа не дошло —
    // ретрай бесполезен, но сообщение должно быть понятным в логе фолбэка.
    throw new Error(`gemini: пустой ответ (finishReason=${candidate?.finishReason ?? "?"})`);
  }
  return text;
}

export const aiGenerate = createServerFn({ method: "POST" })
  .validator((input: AiInput) => input)
  .handler(async ({ data }): Promise<string> => {
    const key = await getKey();
    if (!key) throw new Error("GEMINI_API_KEY не задан");
    const model = getModel();

    const deadline = Date.now() + TOTAL_BUDGET_MS;
    let lastError: unknown;
    // Несколько попыток с нарастающей паузой. Первая — без паузы. 429/5xx/сеть —
    // транзиентные, ждём и пробуем ещё, чтобы не сваливаться в мок с первого сбоя.
    const backoffsMs = [0, 800, 1800];
    for (let round = 0; round < backoffsMs.length; round++) {
      if (backoffsMs[round]) await sleep(backoffsMs[round]!);
      // Каждая попытка ограничена и своим таймаутом, и остатком общего бюджета —
      // что кончится раньше. Если остатка почти нет, новую попытку не начинаем:
      // она всё равно не успеет, а время нужно фолбэку.
      const left = deadline - Date.now();
      if (left < 1_000) break;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, left));
      try {
        return await callGemini(key, model, data, controller.signal);
      } catch (error) {
        lastError = error;
        const { status, transient } = error as { status?: number; transient?: boolean };
        // 400 — кривой запрос/промпт, 401/403 — плохой ключ или блок по стране,
        // 404 с телом — нет такой модели: ретраи не помогут, сразу на мок.
        // Остальное (429 / 5xx / сеть / таймаут / пустой 404) — ретраим.
        const fatal = status === 400 || status === 401 || status === 403 || status === 404;
        if (fatal && !transient) throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error("gemini: недоступен");
  });
