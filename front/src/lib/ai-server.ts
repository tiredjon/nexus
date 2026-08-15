// Серверная обёртка над Gemini. Единственное место, где живут API-ключи —
// тело .handler() исполняется только на сервере и вырезается из клиентского
// бандла, поэтому ключи в браузер не утекают.
//
// Ключи раздаются round-robin (курсор сдвигается на каждый запрос), а при
// ошибке/лимите (429) запрос перебирает остальные ключи — так 6 ключей free-tier
// суммарно поднимают потолок с 15 до ~90 запросов в минуту.
import { createServerFn } from "@tanstack/react-start";

export type GeminiInput = {
  prompt: string;
  /** true → просим модель вернуть строго JSON (responseMimeType). */
  json?: boolean;
  /** 0 — детерминированно (разбор заметки), выше — «живее» (справка/сводка). */
  temperature?: number;
  /** Схема ответа (подмножество OpenAPI). С ней модель гарантирует валидную
   *  структуру JSON — так исключаются битые/обрезанные ответы. */
  schema?: unknown;
};

const DEFAULT_MODEL = "gemini-3.5-flash";
// Если ключ не имеет доступа к основной модели (404 «no longer available to new
// users») — прозрачно пробуем универсальный rolling-алиас, доступный всем.
const FALLBACK_MODEL = "gemini-flash-latest";
const REQUEST_TIMEOUT_MS = 25_000;

const endpoint = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// Курсор round-robin. На одном dev-процессе распределяет нагрузку честно; в
// serverless это best-effort, но failover ниже всё равно спасает от 429.
let cursor = 0;

let cachedKeys: string[] | null = null;

// Ключи берём из process.env (nitro/node подхватывают .env). Если по какой-то
// причине переменной нет (иной раннер dev-сервера) — один раз читаем .env с
// диска. fs импортируется лениво, чтобы не тянуть node-модуль в клиентский граф.
async function getKeys(): Promise<string[]> {
  if (cachedKeys) return cachedKeys;

  const fromEnv = (process.env["GEMINI_API_KEYS"] ?? "").trim();
  if (fromEnv) {
    cachedKeys = splitKeys(fromEnv);
    return cachedKeys;
  }

  try {
    const { readFileSync } = await import("node:fs");
    const raw = readFileSync(new URL("../../.env", import.meta.url), "utf8");
    const line = raw.split(/\r?\n/).find((l) => l.startsWith("GEMINI_API_KEYS="));
    if (line) {
      cachedKeys = splitKeys(line.slice("GEMINI_API_KEYS=".length));
      return cachedKeys;
    }
  } catch {
    // нет доступа к fs (edge) или файла нет — оставляем пустой список
  }

  cachedKeys = [];
  return cachedKeys;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function splitKeys(value: string): string[] {
  return value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function getModel(): string {
  return (process.env["GEMINI_MODEL"] ?? "").trim() || DEFAULT_MODEL;
}

async function callGemini(
  key: string,
  model: string,
  input: GeminiInput,
  signal: AbortSignal,
): Promise<string> {
  const body = {
    contents: [{ parts: [{ text: input.prompt }] }],
    generationConfig: {
      temperature: input.temperature ?? 0.4,
      // Наши задачи — извлечение/форматирование, «мышление» не нужно. Оно же
      // съедало 1300–1600 токенов и на длинном промпте обрезало JSON (ответ не
      // закрывался → ошибка парсинга). Отключение чинит JSON, ускоряет и
      // экономит квоту. maxOutputTokens — запас под самый длинный вывод (справка).
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingBudget: 0 },
      ...(input.json ? { responseMimeType: "application/json" } : {}),
      ...(input.schema ? { responseSchema: input.schema } : {}),
    },
  };

  const res = await fetch(endpoint(model, key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`gemini ${res.status}: ${detail.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("gemini: пустой ответ");
  return text;
}

export const geminiGenerate = createServerFn({ method: "POST" })
  .validator((input: GeminiInput) => input)
  .handler(async ({ data }): Promise<string> => {
    const keys = await getKeys();
    if (keys.length === 0) throw new Error("GEMINI_API_KEYS не заданы");

    // Точка старта round-robin, дальше на этом запросе перебираем ключи по кругу.
    const start = cursor;
    cursor = (cursor + 1) % keys.length;

    // На каждом ключе пробуем основную модель, а при 404 (ключ без доступа к
    // ней) — запасную. Дедуп на случай, если GEMINI_MODEL уже равен запасной.
    const models = [...new Set([getModel(), FALLBACK_MODEL])];

    let lastError: unknown;
    // Несколько раундов по всем ключам с нарастающей паузой. Первый круг — без
    // пауз (обычный failover). Если все ключи ответили 429/5xx/сетью, значит
    // словили всплеск лимита — ждём и пробуем ещё, чтобы не сваливаться в мок с
    // первого же 429. Пауза даёт окну rate-limit (per-minute) чуть остыть.
    const backoffsMs = [0, 700, 1500];
    for (let round = 0; round < backoffsMs.length; round++) {
      if (backoffsMs[round]) await sleep(backoffsMs[round]!);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[(start + round + i) % keys.length];
        if (!key) continue;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          for (const model of models) {
            try {
              return await callGemini(key, model, data, controller.signal);
            } catch (error) {
              lastError = error;
              // 400 — кривой запрос, другая модель не спасёт: сразу в мок.
              if ((error as { status?: number }).status === 400) throw error;
              // Иначе (404 — нет доступа к модели, 429 — квота модели исчерпана)
              // пробуем следующую модель на этом же ключе: у моделей квоты
              // раздельные, поэтому flash-latest часто отвечает, когда 3.5 в 429.
            }
          }
        } catch (error) {
          lastError = error;
          const status = (error as { status?: number }).status;
          // 400 — кривой запрос/промпт, ретраи не помогут: выходим на мок сразу.
          if (status === 400) throw error;
          // 429 / 5xx / 401 / 403 / сеть / таймаут — пробуем следующий ключ,
          // а после полного круга — следующий раунд с паузой.
        } finally {
          clearTimeout(timer);
        }
      }
    }
    throw lastError ?? new Error("gemini: все ключи недоступны");
  });
