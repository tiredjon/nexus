import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/client.js";
import {
  BUSINESS,
  EMPLOYERS,
  type EducationLevel,
  type EmploymentStatus,
  type DesiredDirection,
  FEMALE,
  type HistoryEvent,
  INSTITUTIONS,
  JOBS,
  MAHALLAS,
  MAHALLA_COORDS,
  MAHALLA_ID_BY_NAME,
  MALE,
  type Mahalla,
  type MaritalStatus,
  OTHER,
  PROGRAMS,
  type Person,
  type ProgramOutcome,
  type ReviewStatus,
  SKILL_POOL,
  SPECIALTIES,
  STUDIES,
  SURNAMES,
  UPDATE_SOURCES,
  mulberry32,
} from "../src/db/constants.js";
import { historyEvents, mahallas, people } from "../src/db/schema.js";

// Сидер v3 (sync-front-model): порт generatePeople() из актуального
// front/src/lib/data.ts — дословно. Отличие от фронта — фиксированный --anchor
// вместо Date.now() (воспроизводимость). Флаги:
//   --count N        число людей (деф. 250)
//   --anchor YYYY-MM-DD  «сегодня» для расчёта дат/года рождения (деф. сегодня)
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

function buildFullName(
  gender: Person["gender"],
  lastName: string,
  firstName: string,
  patronymic: string,
) {
  return gender === "Мужской"
    ? `${lastName} ${firstName} ${patronymic} угли`
    : `${lastName} ${firstName} ${patronymic} кизи`;
}

function pickEducationLevel(age: number, rnd: () => number): EducationLevel {
  if (age <= 19) {
    if (rnd() < 0.35) return "Среднее";
    if (rnd() < 0.65) return "Колледж";
    return "Бакалавр";
  }
  if (age <= 22) {
    if (rnd() < 0.25) return "Среднее специальное";
    if (rnd() < 0.7) return "Бакалавр";
    return "Колледж";
  }
  if (age <= 25) {
    if (rnd() < 0.15) return "Среднее специальное";
    if (rnd() < 0.75) return "Бакалавр";
    return age >= 24 ? "Магистр" : "Бакалавр";
  }
  if (rnd() < 0.2) return "Среднее специальное";
  if (rnd() < 0.65) return "Бакалавр";
  return age >= 26 ? "Магистр" : "Бакалавр";
}

function pickSkills(rnd: () => number, count: number) {
  const pool = [...SKILL_POOL].sort(() => rnd() - 0.5);
  return pool.slice(0, count);
}

function pickLanguages(rnd: () => number) {
  const langs = ["узбекский", "русский"];
  if (rnd() > 0.45) langs.push("английский");
  return langs;
}

function officerName(pick: <T>(arr: readonly T[]) => T) {
  const ln = pick(SURNAMES);
  const fn = pick(MALE);
  const pat = pick(MALE);
  return `${ln} ${fn} ${pat} угли`;
}

// Порт generatePeople(): те же вызовы rnd() и та же логика, что во фронте
// (seed mulberry32(20260814)). lightHistory меняет только состав history —
// количество вызовов rnd() не трогает, поэтому поля людей идентичны в обоих
// режимах.
function generatePeople(count: number, anchorMs: number, lightHistory: boolean): Person[] {
  const rnd = mulberry32(20260814);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const isoMinusDays = (d: number) =>
    new Date(anchorMs - d * 86400000).toISOString().slice(0, 10);
  const anchorYear = new Date(anchorMs).getUTCFullYear();
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const gender: Person["gender"] = rnd() > 0.5 ? "Мужской" : "Женский";
    const surnameBase = pick(SURNAMES);
    const lastName = gender === "Женский" ? `${surnameBase}а` : surnameBase;
    const firstName = gender === "Мужской" ? pick(MALE) : pick(FEMALE);
    const patronymic = pick(MALE);
    const fullName = buildFullName(gender, lastName, firstName, patronymic);
    const age = 18 + Math.floor(rnd() * 13);
    const birthYear = anchorYear - age;
    const birthMonth = 1 + Math.floor(rnd() * 12);
    const birthDay = 1 + Math.floor(rnd() * 28);
    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
    const mahalla = pick(MAHALLAS);
    const streetBlock =
      rnd() > 0.5 ? `квартал ${1 + Math.floor(rnd() * 8)}` : `массив ${1 + Math.floor(rnd() * 5)}`;
    const educationLevel = pickEducationLevel(age, rnd);

    const r = rnd();
    let status: EmploymentStatus;
    if (r < 0.42) status = "Работает";
    else if (r < 0.62) status = "Учится";
    else if (r < 0.78) status = "Безработный";
    else if (r < 0.86) status = "Предприниматель";
    else if (r < 0.93) status = "Другая деятельность";
    else status = "Статус не уточнён";

    let educationInstitution: string | null = null;
    let graduationYear: number | null = null;
    let specialty: string | null = null;

    if (status === "Учится") {
      educationInstitution = pick(INSTITUTIONS);
      specialty = pick(SPECIALTIES);
      graduationYear = null;
    } else if (educationLevel !== "Среднее") {
      specialty = rnd() > 0.25 ? pick(SPECIALTIES) : null;
      educationInstitution = rnd() > 0.35 ? pick(INSTITUTIONS) : null;
      const minGrad = birthYear + (educationLevel === "Магистр" ? 24 : educationLevel === "Бакалавр" ? 22 : 19);
      graduationYear =
        minGrad <= birthYear + age
          ? minGrad + Math.floor(rnd() * Math.max(1, age - (minGrad - birthYear)))
          : null;
      if (graduationYear && graduationYear > birthYear + age) {
        graduationYear = birthYear + age - 1;
      }
    }

    let employer: string | null = null;
    let isFormalEmployment = false;
    let workExperienceMonths = 0;

    if (status === "Работает") {
      isFormalEmployment = rnd() > 0.25;
      employer = isFormalEmployment ? pick(EMPLOYERS) : "не указано";
      workExperienceMonths = 6 + Math.floor(rnd() * Math.min(Math.max(age - 17, 1) * 10, 96));
    } else if (status === "Предприниматель") {
      isFormalEmployment = rnd() > 0.55;
      employer = isFormalEmployment ? pick(BUSINESS) : "не указано";
      workExperienceMonths = 3 + Math.floor(rnd() * Math.min(Math.max(age - 17, 1) * 8, 72));
    } else if (status === "Другая деятельность" && rnd() > 0.5) {
      workExperienceMonths = Math.floor(rnd() * 24);
    }

    const skillCount = status === "Безработный" ? Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 3);
    const skills = pickSkills(rnd, skillCount);
    const hasDriverLicense = skills.includes("водительские права B") || rnd() > 0.65;
    const languages = pickLanguages(rnd);

    let desiredDirection: DesiredDirection = "Не определился";
    if (status === "Безработный" || status === "Статус не уточнён") {
      desiredDirection =
        rnd() < 0.35
          ? "Трудоустройство"
          : rnd() < 0.55
            ? "Профессиональное обучение"
            : rnd() < 0.7
              ? "Не определился"
              : rnd() < 0.85
                ? "Возвращение к обучению"
                : "Предпринимательство";
    } else if (status === "Предприниматель") {
      desiredDirection = "Предпринимательство";
    } else if (status === "Учится") {
      desiredDirection = rnd() > 0.7 ? "Трудоустройство" : "Не определился";
    } else {
      desiredDirection = rnd() > 0.6 ? "Трудоустройство" : "Не определился";
    }

    let activity = "—";
    if (status === "Работает") activity = pick(JOBS);
    else if (status === "Учится")
      activity = educationInstitution
        ? `${educationInstitution}${specialty ? ` · ${specialty}` : ""}`
        : pick(STUDIES);
    else if (status === "Предприниматель") activity = pick(BUSINESS);
    else if (status === "Другая деятельность") activity = pick(OTHER);
    else if (status === "Безработный") activity = "Ищет работу";
    else activity = "Данные не подтверждены";

    const neet =
      status === "Безработный" || (status === "Статус не уточнён" && rnd() > 0.35);

    const updDays = rnd() > 0.75 ? 95 + Math.floor(rnd() * 200) : Math.floor(rnd() * 85);
    const lastUpdate = isoMinusDays(updDays);
    const lastUpdateSource = pick(UPDATE_SOURCES);

    const householdSize = 2 + Math.floor(rnd() * 8);
    const maritalStatus: MaritalStatus =
      age >= 22 && rnd() > 0.45 ? "Женат/замужем" : "Не женат/не замужем";
    const hasChildren = age >= 22 && maritalStatus === "Женат/замужем" && rnd() > 0.4;
    const isBreadwinner = rnd() > 0.72;
    const inYoshlarDaftari = rnd() > 0.38;
    const inAyollarDaftari = gender === "Женский" && rnd() > 0.68;
    const familyInTemirDaftar = rnd() > 0.82;

    const hasProfession = skills.length > 0 || specialty != null;
    const businessInterest = desiredDirection === "Предпринимательство";
    const droppedStudies = graduationYear === null && status !== "Учится" && educationLevel !== "Среднее";

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
      const d = isoMinusDays(Math.max(base, updDays));
      // lightHistory: rnd() дёргается всегда (детерминизм), сохраняем только
      // первое событие — итого ≤2 записи с «Актуальный статус» ниже.
      if (!lightHistory || e === 0) {
        history.push({ date: d, title: seeds[e % seeds.length]! });
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
      lastName,
      firstName,
      patronymic,
      fullName,
      age,
      birthDate,
      gender,
      mahalla,
      streetBlock,
      educationLevel,
      educationInstitution,
      graduationYear,
      specialty,
      status,
      activity,
      employer,
      isFormalEmployment,
      workExperienceMonths,
      skills,
      desiredDirection,
      hasDriverLicense,
      languages,
      inYoshlarDaftari,
      inAyollarDaftari,
      familyInTemirDaftar,
      householdSize,
      maritalStatus,
      hasChildren,
      isBreadwinner,
      lastUpdate,
      lastUpdateSource,
      responsibleOfficer: officerName(pick),
      needsSupport: neet ? rnd() > 0.25 : rnd() > 0.85,
      neet,
      neetReviewStatus,
      hasProfession,
      businessInterest,
      droppedStudies,
      history,
      program: null,
      programOutcome: null,
      programRoutedAt: null,
      routedBy: null,
      outcome: null,
    });
  }

  const pickOutcome = (): ProgramOutcome => {
    const r = rnd();
    if (r < 0.22) return "Ожидает";
    if (r < 0.48) return "Приступил";
    if (r < 0.62) return "Завершил";
    if (r < 0.82) return "Трудоустроен";
    if (r < 0.92) return "Не явился";
    return "Отказался";
  };

  const routeCandidates = people
    .filter((p) => p.neet || p.status === "Безработный" || p.status === "Статус не уточнён")
    .sort(() => rnd() - 0.5)
    .slice(0, 40);

  for (const p of routeCandidates) {
    const program = pick(PROGRAMS);
    const routedAt = isoMinusDays(10 + Math.floor(rnd() * 90));
    const outcome = pickOutcome();

    p.program = program;
    p.programRoutedAt = routedAt;
    p.routedBy = `Представитель по молодёжи · ${p.mahalla}`;
    p.programOutcome = outcome;
    p.status = "Направлен на программу";
    p.neetReviewStatus = "Подтверждено";

    if (!lightHistory) {
      p.history.push({
        date: routedAt,
        title: `Направлен на программу: ${program}`,
        source: "программа",
      });
    }

    if (outcome === "Трудоустроен") {
      p.status = "Работает";
      p.outcome = "Трудоустроен";
      p.isFormalEmployment = rnd() > 0.3;
      p.employer = p.isFormalEmployment ? pick(EMPLOYERS) : "не указано";
      p.workExperienceMonths = Math.max(p.workExperienceMonths, 6 + Math.floor(rnd() * 24));
      p.lastUpdate = isoMinusDays(Math.floor(rnd() * 14));
      if (!lightHistory) {
        p.history.push({ date: p.lastUpdate, title: `Исход участия: ${outcome}`, source: "программа" });
      }
    } else if (outcome === "Завершил") {
      p.outcome = "В процессе";
      const d = isoMinusDays(Math.floor(rnd() * 10));
      if (!lightHistory) {
        p.history.push({ date: d, title: `Исход участия: ${outcome}`, source: "программа" });
      }
    } else if (outcome === "Приступил") {
      p.outcome = "В процессе";
      const d = isoMinusDays(Math.floor(rnd() * 20));
      if (!lightHistory) {
        p.history.push({ date: d, title: `Исход участия: ${outcome}`, source: "программа" });
      }
    } else {
      p.outcome = "В процессе";
      if (outcome !== "Ожидает") {
        const d = isoMinusDays(Math.floor(rnd() * 15));
        if (!lightHistory) {
          p.history.push({ date: d, title: `Исход участия: ${outcome}`, source: "программа" });
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
      lastName: p.lastName,
      firstName: p.firstName,
      patronymic: p.patronymic,
      fullName: p.fullName,
      age: p.age,
      birthDate: p.birthDate,
      gender: p.gender,
      mahallaId: MAHALLA_ID_BY_NAME[p.mahalla],
      streetBlock: p.streetBlock,
      educationLevel: p.educationLevel,
      educationInstitution: p.educationInstitution,
      graduationYear: p.graduationYear,
      specialty: p.specialty,
      status: p.status,
      activity: p.activity,
      employer: p.employer,
      isFormalEmployment: p.isFormalEmployment,
      workExperienceMonths: p.workExperienceMonths,
      skills: p.skills,
      desiredDirection: p.desiredDirection,
      hasDriverLicense: p.hasDriverLicense,
      languages: p.languages,
      inYoshlarDaftari: p.inYoshlarDaftari,
      inAyollarDaftari: p.inAyollarDaftari,
      familyInTemirDaftar: p.familyInTemirDaftar,
      householdSize: p.householdSize,
      maritalStatus: p.maritalStatus,
      hasChildren: p.hasChildren,
      isBreadwinner: p.isBreadwinner,
      lastUpdate: p.lastUpdate,
      lastUpdateSource: p.lastUpdateSource,
      responsibleOfficer: p.responsibleOfficer,
      needsSupport: p.needsSupport,
      neet: p.neet,
      neetReviewStatus: p.neetReviewStatus,
      hasProfession: p.hasProfession,
      businessInterest: p.businessInterest,
      droppedStudies: p.droppedStudies,
      program: p.program,
      programOutcome: p.programOutcome,
      programRoutedAt: p.programRoutedAt,
      routedBy: p.routedBy,
      outcome: p.outcome,
    }));
    const historyRows: HistoryRow[] = chunk.flatMap((p) =>
      p.history.map((h) => ({
        personId: p.id,
        date: h.date,
        title: h.title,
        note: h.note ?? null,
        source: h.source ?? null,
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
