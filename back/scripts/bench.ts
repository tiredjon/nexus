// S6: замер p50/p95 против уже запущенного сервера (npm run dev / start).
// Логинится admin'ом, N раз дёргает три эндпоинта (список с фильтром+поиском+
// пагинацией, дашборд, карта), печатает markdown-таблицу с латентностью.
//
// Запуск: npm run bench -- [--n 30] [--base http://localhost:3001]

export {};

type Args = { n: number; base: string };

function parseArgs(argv: string[]): Args {
  let n = 30;
  let base = "http://localhost:3001";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--n") n = Number.parseInt(argv[++i] ?? "", 10);
    else if (a === "--base") base = argv[++i] ?? base;
  }
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Некорректный --n: ${n}`);
  }
  return { n, base };
}

const WARMUP = 5;

async function login(base: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "admin" }),
  });
  if (!res.ok) {
    throw new Error(`Логин не удался: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function timeRequests(url: string, token: string, count: number): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`${url} -> ${res.status} ${await res.text()}`);
    }
    await res.json();
    times.push(performance.now() - start);
  }
  return times;
}

// p — доля в [0,1]; классический "nearest-rank" перцентиль по отсортированному массиву.
function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx]!;
}

type Case = { name: string; path: string };

// Список с фильтром+поиском+пагинацией — самый тяжёлый читающий запрос
// (ILIKE по trigram-индексу + WHERE + сортировка + LIMIT/OFFSET + отдельный count).
const CASES: Case[] = [
  {
    name: "GET /api/people (query+status+page)",
    path: "/api/people?query=ова&status=Работает&sort=fullName&order=asc&page=3&pageSize=50",
  },
  { name: "GET /api/stats/dashboard", path: "/api/stats/dashboard" },
  { name: "GET /api/stats/map", path: "/api/stats/map" },
];

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const token = await login(args.base);

  const rows: { name: string; min: number; p50: number; p95: number; max: number }[] = [];

  for (const c of CASES) {
    const url = `${args.base}${c.path}`;
    await timeRequests(url, token, WARMUP);
    const times = (await timeRequests(url, token, args.n)).sort((a, b) => a - b);
    rows.push({
      name: c.name,
      min: times[0]!,
      p50: percentile(times, 0.5),
      p95: percentile(times, 0.95),
      max: times[times.length - 1]!,
    });
  }

  console.log(`\nБэнч (n=${args.n}, база: ${args.base})\n`);
  console.log("| Запрос | min (мс) | p50 (мс) | p95 (мс) | max (мс) |");
  console.log("|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| ${r.name} | ${r.min.toFixed(1)} | ${r.p50.toFixed(1)} | ${r.p95.toFixed(1)} | ${r.max.toFixed(1)} |`,
    );
  }
}

await main();
