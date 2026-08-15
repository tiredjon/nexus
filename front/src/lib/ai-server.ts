// Серверная обёртка над LLM. Единственное место, где живёт API-ключ — тело
// .handler() исполняется только на сервере и вырезается из клиентского бандла,
// поэтому ключ в браузер не утекает.
//
// Провайдер — DeepSeek (OpenAI-совместимый API). Причина именно его: прод-сервер
// у нас в РФ, а Google блокирует Gemini по стране egress-IP («User location is
// not supported») — на российском хосте он бы не работал. DeepSeek из РФ
// доступен. Модель по умолчанию — deepseek-v4-pro (сильная, с reasoning).
// Reasoning-текст приходит в отдельном поле reasoning_content, а message.content
// остаётся чистым JSON — как раз то, что мы парсим.
import { createServerFn } from "@tanstack/react-start";

export type AiInput = {
  prompt: string;
  /** true → response_format json_object: модель возвращает валидный JSON.
   *  Структуру задаём прямо в промпте (у DeepSeek нет responseSchema). */
  json?: boolean;
  /** 0 — детерминированно (разбор заметки), выше — «живее» (справка/сводка). */
  temperature?: number;
  /** Не используется DeepSeek — оставлено для совместимости вызовов ai.ts. */
  schema?: unknown;
};

// deepseek-v4-pro — флагманская модель; deepseek-v4-flash быстрее, но слабее.
const DEFAULT_MODEL = "deepseek-v4-pro";
const ENDPOINT = "https://api.deepseek.com/chat/completions";
// Pro «думает» перед ответом (reasoning), на длинной справке это 15–30 с. Ставим
// с запасом, чтобы reasoning-латентность не роняла нас в мок по таймауту. Для
// тяжёлых ответов (справка, сводка) латентность и так скрыта прогревом кэша.
const REQUEST_TIMEOUT_MS = 45_000;
// reasoning-токены расходуют тот же бюджет, что и вывод, поэтому запас большой:
// на самой длинной справке (6 разделов) хватает и на «мышление», и на JSON.
const MAX_TOKENS = 8192;

let cachedKey: string | null = null;

// Ключ берём из process.env (nitro/node подхватывают .env). Если переменной нет
// (иной раннер dev-сервера) — один раз читаем .env с диска. fs импортируется
// лениво, чтобы не тянуть node-модуль в клиентский граф.
async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  const fromEnv = (process.env["DEEPSEEK_API_KEY"] ?? "").trim();
  if (fromEnv) {
    cachedKey = fromEnv;
    return cachedKey;
  }

  try {
    const { readFileSync } = await import("node:fs");
    const raw = readFileSync(new URL("../../.env", import.meta.url), "utf8");
    const line = raw.split(/\r?\n/).find((l) => l.startsWith("DEEPSEEK_API_KEY="));
    if (line) {
      cachedKey = line.slice("DEEPSEEK_API_KEY=".length).trim();
      return cachedKey;
    }
  } catch {
    // нет доступа к fs (edge) или файла нет — оставляем пустую строку
  }

  cachedKey = "";
  return cachedKey;
}

function getModel(): string {
  return (process.env["DEEPSEEK_MODEL"] ?? "").trim() || DEFAULT_MODEL;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function callDeepSeek(
  key: string,
  model: string,
  input: AiInput,
  signal: AbortSignal,
): Promise<string> {
  const body = {
    model,
    messages: [{ role: "user", content: input.prompt }],
    temperature: input.temperature ?? 0.4,
    max_tokens: MAX_TOKENS,
    stream: false,
    // json_object требует, чтобы слово «json»/структура были в промпте — у нас
    // все промпты явно диктуют форму ответа, так что этого достаточно.
    ...(input.json ? { response_format: { type: "json_object" as const } } : {}),
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`deepseek ${res.status}: ${detail.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  // Берём только content — reasoning_content (мышление модели) игнорируем.
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("deepseek: пустой ответ");
  return text;
}

export const aiGenerate = createServerFn({ method: "POST" })
  .validator((input: AiInput) => input)
  .handler(async ({ data }): Promise<string> => {
    const key = await getKey();
    if (!key) throw new Error("DEEPSEEK_API_KEY не задан");
    const model = getModel();

    let lastError: unknown;
    // Несколько попыток с нарастающей паузой. Первая — без паузы. 429/5xx/сеть —
    // транзиентные, ждём и пробуем ещё, чтобы не сваливаться в мок с первого сбоя.
    const backoffsMs = [0, 800, 1800];
    for (let round = 0; round < backoffsMs.length; round++) {
      if (backoffsMs[round]) await sleep(backoffsMs[round]!);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        return await callDeepSeek(key, model, data, controller.signal);
      } catch (error) {
        lastError = error;
        const status = (error as { status?: number }).status;
        // 400 — кривой запрос/промпт, 401 — плохой ключ: ретраи не помогут,
        // сразу на мок. Остальное (429 / 5xx / сеть / таймаут) — ретраим.
        if (status === 400 || status === 401) throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error("deepseek: недоступен");
  });
