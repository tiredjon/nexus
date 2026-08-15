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
};

const DEFAULT_MODEL = "gemini-2.5-flash";
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
  input: GeminiInput,
  signal: AbortSignal,
): Promise<string> {
  const body = {
    contents: [{ parts: [{ text: input.prompt }] }],
    generationConfig: {
      temperature: input.temperature ?? 0.4,
      ...(input.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(endpoint(getModel(), key), {
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

    let lastError: unknown;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(start + i) % keys.length];
      if (!key) continue;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        return await callGemini(key, data, controller.signal);
      } catch (error) {
        lastError = error;
        // 429 (лимит), 5xx, 401/403 (плохой ключ), сетевые/таймаут — пробуем
        // следующий ключ. Смысла различать нет: любой из них лечится failover.
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error("gemini: все ключи недоступны");
  });
