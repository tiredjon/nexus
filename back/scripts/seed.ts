import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/client.js";
import {
  BUSINESS,
  FEMALE,
  JOBS,
  MAHALLAS,
  MAHALLA_COORDS,
  MAHALLA_ID_BY_NAME,
  MALE,
  OTHER,
  PATRON,
  PROGRAMS,
  type EmploymentStatus,
  type HistoryEvent,
  type Mahalla,
  type Person,
  type ReviewStatus,
  STUDIES,
  SURNAMES,
  mulberry32,
} from "../src/db/constants.js";
import { historyEvents, mahallas, people } from "../src/db/schema.js";

// Сидер v2 (S2): порт generatePeople() из front/src/lib/data.ts — дословно.
// Единственное отличие от фронта: вместо Date.now() используется фиксированный
// --anchor, чтобы прогоны были воспроизводимы. Флаги:
//   --count N        число людей (деф. 250)
//   --anchor YYYY-MM-DD  «сегодня» для расчёта дат (деф. сегодня)
//   --append         не чистить people/history перед сидом
//   --lightHistory   ≤2 события на человека (для больших объёмов)

type Args = {
  count: number;
  anchorMs: number;
  append: boolean;
  lightHistory: boolean;
};

function parseArgs(argv: string[]): Args {
  let count = 250;
  let anchor = new Date().toISOString().slice(0, 10);
  let append = false;
  let lightHistory = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--count") count = Number.parseInt(argv[++i] ?? "", 10);
    else if (a === "--anchor") anchor = argv[++i] ?? anchor;
    else if (a === "--append") append = true;
    else if (a === "--lightHistory") lightHistory = true;
  }
  if (!Number.isFinite(count) || count < 0) {
    throw new Error(`Некорректный --count: ${count}`);
  }
  const anchorMs = Date.parse(`${anchor}T00:00:00.000Z`);
  if (!Number.isFinite(anchorMs)) {
    throw new Error(`Некорректный --anchor: ${anchor}`);
  }
  return { count, anchorMs, append, lightHistory };
}

// Порт generatePeople(): та же логика и тот же порядок вызовов rnd(), что во
// фронте (seed mulberry32(20260814)). lightHistory меняет только состав
// history — количество вызовов rnd() не трогает, поэтому поля людей идентичны
// в обоих режимах.
function generatePeople(count: number, anchorMs: number, lightHistory: boolean): Person[] {
  const rnd = mulberry32(20260814);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const isoMinusDays = (d: number) =>
    new Date(anchorMs - d * 86400000).toISOString().slice(0, 10);
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const gender = rnd() > 0.5 ? "Мужской" : "Женский";
    const first = gender === "Мужской" ? pick(MALE) : pick(FEMALE);
    const fullName = `${pick(SURNAMES)}${gender === "Женский" ? "а" : ""} ${first} ${gender === "Мужской" ? PATRON[0] : PATRON[1]}`;
    const age = 18 + Math.floor(rnd() * 13);
    const mahalla = pick(MAHALLAS);

    const r = rnd();
    let status: EmploymentStatus;
    if (r < 0.42) status = "Работает";
    else if (r < 0.62) status = "Учится";
    else if (r < 0.78) status = "Безработный";
    else if (r < 0.86) status = "Предприниматель";
    else if (r < 0.93) status = "Другая деятельность";
    else status = "Статус не уточнён";

    let activity = "—";
    if (status === "Работает") activity = pick(JOBS);
    else if (status === "Учится") activity = pick(STUDIES);
    else if (status === "Предприниматель") activity = pick(BUSINESS);
    else if (status === "Другая деятельность") activity = pick(OTHER);
    else if (status === "Безработный") activity = "Ищет работу";
    else activity = "Данные не подтверждены";

    const neet =
      status === "Безработный" || (status === "Статус не уточнён" && rnd() > 0.35);

    const updDays = rnd() > 0.75 ? 95 + Math.floor(rnd() * 200) : Math.floor(rnd() * 85);
    const lastUpdate = isoMinusDays(updDays);

    const history: HistoryEvent[] = [];
    const evCount = 2 + Math.floor(rnd() * 4);
    let base = 400;
    const seeds = [
      "Первичный учёт в реестре махалли",
      "Обновление данных подворного обхода",
      "Собеседование с инспектором махалли",
      "Направлен на проф. обучение",
      "Участие в ярмарке вакансий",
      "Трудоустроен",
    ];
    for (let e = 0; e < evCount; e++) {
      base -= 20 + Math.floor(rnd() * 90);
      // lightHistory: rnd() всё равно дёргается (детерминизм), но событие
      // сохраняем только первое — итого ≤2 записи с «Актуальный статус» ниже.
      if (!lightHistory || e === 0) {
        history.push({ date: isoMinusDays(Math.max(base, updDays)), title: seeds[e % seeds.length]! });
      }
    }
    history.sort((a, b) => a.date.localeCompare(b.date));
    history.push({ date: lastUpdate, title: `Актуальный статус: ${status}` });

    const rs = rnd();
    const neetReviewStatus: ReviewStatus = !neet
      ? "Флаг снят"
      : rs < 0.5
        ? "Ожидает проверки"
        : rs < 0.72
          ? "На уточнении"
          : rs < 0.9
            ? "Подтверждено"
            : "Флаг снят";

    people.push({
      id: `Y-${1000 + i}`,
      fullName,
      age,
      gender,
      mahalla,
      status,
      activity,
      lastUpdate,
      needsSupport: neet ? rnd() > 0.25 : rnd() > 0.85,
      neet,
      neetReviewStatus,
      hasProfession: rnd() > 0.5,
      businessInterest: rnd() > 0.75,
      droppedStudies: rnd() > 0.8,
      history,
      program: null,
      outcome: null,
    });
  }

  // немного уже направленных для аналитики
  for (const p of people) {
    if (p.neet && p.neetReviewStatus === "Подтверждено" && rnd() > 0.4) {
      p.program = pick(PROGRAMS);
      p.status = "Направлен на программу";
      p.outcome = rnd() > 0.55 ? (rnd() > 0.6 ? "Трудоустроен" : "Учится") : "В процессе";
      // history этой мутации под lightHistory опускаем — rnd() уже отработал.
      if (!lightHistory) {
        p.history.push({
          date: isoMinusDays(10 + Math.floor(rnd() * 60)),
          title: `Направлен на программу: ${p.program}`,
        });
        if (p.outcome !== "В процессе") {
          p.history.push({
            date: isoMinusDays(5 + Math.floor(rnd() * 20)),
            title: `Результат: ${p.outcome}`,
          });
        }
      } else {
        // Сохраняем идентичный поток rnd() для полного/лёгкого режимов.
        isoMinusDays(10 + Math.floor(rnd() * 60));
        if (p.outcome !== "В процессе") {
          isoMinusDays(5 + Math.floor(rnd() * 20));
        }
      }
    }
  }

  return people;
}

async function upsertMahallas(): Promise<void> {
  for (const name of MAHALLAS) {
    const [lat, lng] = MAHALLA_COORDS[name as Mahalla];
    await db
      .insert(mahallas)
      .values({ id: MAHALLA_ID_BY_NAME[name as Mahalla], name, lat, lng })
      .onConflictDoUpdate({ target: mahallas.id, set: { name, lat, lng } });
  }
}

type PersonRow = typeof people.$inferInsert;
type HistoryRow = typeof historyEvents.$inferInsert;

const BATCH = 1000;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  await upsertMahallas();

  if (!args.append) {
    await db.execute(sql`TRUNCATE people, history_events RESTART IDENTITY CASCADE`);
  }

  const generated = generatePeople(args.count, args.anchorMs, args.lightHistory);

  let historyCount = 0;
  for (let start = 0; start < generated.length; start += BATCH) {
    const chunk = generated.slice(start, start + BATCH);
    const personRows: PersonRow[] = chunk.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      mahallaId: MAHALLA_ID_BY_NAME[p.mahalla],
      status: p.status,
      activity: p.activity,
      lastUpdate: p.lastUpdate,
      needsSupport: p.needsSupport,
      neet: p.neet,
      neetReviewStatus: p.neetReviewStatus,
      hasProfession: p.hasProfession,
      businessInterest: p.businessInterest,
      droppedStudies: p.droppedStudies,
      program: p.program,
      outcome: p.outcome,
    }));
    const historyRows: HistoryRow[] = chunk.flatMap((p) =>
      p.history.map((h) => ({
        personId: p.id,
        date: h.date,
        title: h.title,
        note: h.note ?? null,
      })),
    );
    historyCount += historyRows.length;

    await db.transaction(async (tx) => {
      await tx.insert(people).values(personRows);
      // history вставляем своими батчами — на 100k строк один VALUES слишком велик.
      for (let hs = 0; hs < historyRows.length; hs += BATCH) {
        await tx.insert(historyEvents).values(historyRows.slice(hs, hs + BATCH));
      }
    });
  }

  console.log(
    `Засеяно: людей ${generated.length}, событий истории ${historyCount}` +
      (args.lightHistory ? " (lightHistory)" : "") +
      (args.append ? " (append)" : ""),
  );
}

await main();
await pool.end();
