import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import {
  MAHALLAS,
  MAHALLA_COORDS,
  MAHALLA_ID_BY_NAME,
  type Mahalla,
} from "../src/db/constants.js";
import { historyEvents, mahallas, people } from "../src/db/schema.js";
import type { SessionPayload } from "../src/plugins/auth.js";

export { buildApp };

// Чистит все доменные таблицы между тестами. CASCADE + RESTART IDENTITY, чтобы
// сброс history_events.id был предсказуемым.
export async function truncateAll(): Promise<void> {
  await db.execute(
    sql`TRUNCATE people, history_events, mahallas RESTART IDENTITY CASCADE`,
  );
}

export async function makeApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

// Детерминированно вставляет 12 махаллей (без людей) — для тестов meta/auth.
export async function seedMahallas(): Promise<void> {
  for (const name of MAHALLAS) {
    const [lat, lng] = MAHALLA_COORDS[name as Mahalla];
    await db
      .insert(mahallas)
      .values({ id: MAHALLA_ID_BY_NAME[name as Mahalla], name, lat, lng });
  }
}

type PersonInsert = typeof people.$inferInsert;

const iso = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

// Даты фикстуры относительно «сегодня»: NOW свежая, STALE — заведомо за
// порогом 90 дней (фильтр ?stale=true).
export const FIXTURE_NOW = iso(0);
export const FIXTURE_RECENT = iso(10);
export const FIXTURE_STALE = iso(100);
// Самая старая запись — на ней проверяется порядок «сначала протухшие»
// (attention на дашборде, колонки канбана).
export const FIXTURE_OLDEST = iso(120);

// Заполняет обязательные поля модели, которые конкретный тест не проверяет —
// иначе каждая запись фикстуры была бы на 40 строк. Значимые поля тесты
// задают явно через override.
function person(over: Partial<PersonInsert> & Pick<PersonInsert, "id">): PersonInsert {
  return {
    lastName: "Каримов",
    firstName: "Азиз",
    patronymic: "угли",
    fullName: "Каримов Азиз угли",
    age: 22,
    birthDate: "2004-01-15",
    gender: "Мужской",
    mahallaId: 1,
    streetBlock: "кв. 1, д. 1",
    educationLevel: "Бакалавр",
    educationInstitution: null,
    graduationYear: null,
    specialty: null,
    status: "Работает",
    activity: "Программист",
    employer: null,
    isFormalEmployment: true,
    workExperienceMonths: 12,
    skills: [],
    desiredDirection: "Трудоустройство",
    hasDriverLicense: false,
    languages: [],
    inYoshlarDaftari: false,
    inAyollarDaftari: false,
    familyInTemirDaftar: false,
    householdSize: 4,
    maritalStatus: "Не женат/не замужем",
    hasChildren: false,
    isBreadwinner: false,
    lastUpdate: FIXTURE_NOW,
    lastUpdateSource: "Подворный обход",
    responsibleOfficer: "Инспектор махалли",
    needsSupport: false,
    neet: false,
    neetReviewStatus: "Флаг снят",
    hasProfession: true,
    businessInterest: false,
    droppedStudies: false,
    program: null,
    programOutcome: null,
    programRoutedAt: null,
    routedBy: null,
    outcome: null,
    ...over,
  };
}

// Детерминированная фикстура: 10 человек с известным составом. Не случайный
// сидер — тесты сверяют точные числа.
//
// Дархан (id 1): Y-1000..Y-1004 — 5 человек
// Буюк Ипак Йули (id 2): Y-1005..Y-1007 — 3 человека
// Олтинтепа (id 3): Y-1008..Y-1009 — 2 человека
//
// neet: Y-1002, Y-1003, Y-1004 (3 шт)
// program IS NOT NULL: Y-1004 (1 шт) — важен для routed_only-скоупа
// stale (>90 дней): Y-1002, Y-1006 (2 шт)
// status="Работает": Y-1000, Y-1001, Y-1008 (3 шт)
export async function seedFixture(): Promise<void> {
  await seedMahallas();

  await db.insert(people).values([
    // Дархан: работают
    person({
      id: "Y-1000",
      lastName: "Каримов",
      firstName: "Азиз",
      fullName: "Каримов Азиз угли",
      age: 22,
      mahallaId: 1,
    }),
    person({
      id: "Y-1001",
      lastName: "Юсупова",
      firstName: "Нилуфар",
      patronymic: "кизи",
      fullName: "Юсупова Нилуфар кизи",
      age: 20,
      gender: "Женский",
      mahallaId: 1,
      activity: "Швея",
      lastUpdate: FIXTURE_RECENT,
    }),
    // Дархан: NEET, давно не обновлялся
    person({
      id: "Y-1002",
      lastName: "Рахимов",
      firstName: "Жасур",
      fullName: "Рахимов Жасур угли",
      age: 25,
      mahallaId: 1,
      status: "Безработный",
      activity: "Ищет работу",
      employer: null,
      isFormalEmployment: false,
      workExperienceMonths: 0,
      lastUpdate: FIXTURE_STALE,
      needsSupport: true,
      neet: true,
      neetReviewStatus: "Ожидает проверки",
      hasProfession: false,
      businessInterest: true,
    }),
    // Дархан: NEET, статус не уточнён
    person({
      id: "Y-1003",
      lastName: "Абдуллаева",
      firstName: "Мадина",
      patronymic: "кизи",
      fullName: "Абдуллаева Мадина кизи",
      age: 19,
      gender: "Женский",
      mahallaId: 1,
      status: "Статус не уточнён",
      activity: "Данные не подтверждены",
      isFormalEmployment: false,
      workExperienceMonths: 0,
      neet: true,
      neetReviewStatus: "На уточнении",
      hasProfession: false,
      droppedStudies: true,
    }),
    // Дархан: единственный направленный на программу
    person({
      id: "Y-1004",
      lastName: "Тошматова",
      firstName: "Зилола",
      patronymic: "кизи",
      fullName: "Тошматова Зилола кизи",
      age: 21,
      gender: "Женский",
      mahallaId: 1,
      status: "Направлен на программу",
      activity: "Профессиональное обучение",
      isFormalEmployment: false,
      workExperienceMonths: 0,
      lastUpdate: FIXTURE_RECENT,
      needsSupport: true,
      neet: true,
      neetReviewStatus: "Подтверждено",
      hasProfession: false,
      program: "Профессиональное обучение",
      programOutcome: "Приступил",
      programRoutedAt: FIXTURE_RECENT,
      routedBy: "Специалист по занятости",
      outcome: "В процессе",
    }),
    // Буюк Ипак Йули: учатся
    person({
      id: "Y-1005",
      lastName: "Нортожиева",
      firstName: "Дилноза",
      patronymic: "кизи",
      fullName: "Нортожиева Дилноза кизи",
      age: 18,
      gender: "Женский",
      mahallaId: 2,
      status: "Учится",
      activity: "ТУИТ, 3 курс",
      isFormalEmployment: false,
      workExperienceMonths: 0,
      hasProfession: false,
    }),
    person({
      id: "Y-1006",
      lastName: "Эргашева",
      firstName: "Гулнора",
      patronymic: "кизи",
      fullName: "Эргашева Гулнора кизи",
      age: 20,
      gender: "Женский",
      mahallaId: 2,
      status: "Учится",
      activity: "Колледж связи",
      isFormalEmployment: false,
      workExperienceMonths: 0,
      lastUpdate: FIXTURE_STALE,
      hasProfession: false,
    }),
    // Буюк Ипак Йули: предприниматель
    person({
      id: "Y-1007",
      lastName: "Мирзаев",
      firstName: "Бекзод",
      fullName: "Мирзаев Бекзод угли",
      age: 28,
      mahallaId: 2,
      status: "Предприниматель",
      activity: "Швейный цех",
      businessInterest: true,
    }),
    // Олтинтепа: старшие
    person({
      id: "Y-1008",
      lastName: "Хамидова",
      firstName: "Севара",
      patronymic: "кизи",
      fullName: "Хамидова Севара кизи",
      age: 30,
      gender: "Женский",
      mahallaId: 3,
      activity: "Логист",
      lastUpdate: FIXTURE_RECENT,
    }),
    person({
      id: "Y-1009",
      lastName: "Салимова",
      firstName: "Шахноза",
      patronymic: "кизи",
      fullName: "Салимова Шахноза кизи",
      age: 29,
      gender: "Женский",
      mahallaId: 3,
      status: "Другая деятельность",
      activity: "Уход за ребёнком",
      isFormalEmployment: false,
      workExperienceMonths: 0,
      hasProfession: false,
    }),
  ]);

  // История: у Y-1002 два события с разными датами — на них проверяется порядок.
  await db.insert(historyEvents).values([
    {
      personId: "Y-1000",
      date: FIXTURE_STALE,
      title: "Первичный учёт в реестре махалли",
    },
    {
      personId: "Y-1002",
      date: FIXTURE_NOW,
      title: "Статус подтверждён сотрудником",
    },
    {
      personId: "Y-1002",
      date: FIXTURE_STALE,
      title: "Собеседование с инспектором махалли",
      note: "Комментарий инспектора",
    },
    {
      personId: "Y-1004",
      date: FIXTURE_RECENT,
      title: "Направлен на программу: Профессиональное обучение",
    },
  ]);
}

// Фикстура для агрегатов (S5): 24 человека в трёх махаллях, остальные девять
// пустые — на них проверяются нулевые строки byMahalla и share = 0.
// ФИО не важны (агрегаты по ним не считают), значимы только status/neet/
// neetReviewStatus/program/outcome/lastUpdate.
//
// Дархан (id 1) — 12: Y-2000..Y-2011
// Буюк Ипак Йули (id 2) — 8: Y-2012..Y-2019
// Олтинтепа (id 3) — 4: Y-2020..Y-2023
//
// Ожидаемые числа по всему срезу (district_officer):
//   total 24, employed 7, unemployed 5, neet 9, unknown 3, stale 5
//   program IS NOT NULL: Y-2008, Y-2009, Y-2016, Y-2022 (4)
//   outcome IN (Трудоустроен, Учится): Y-2009, Y-2016 (2)
export async function seedStatsFixture(): Promise<void> {
  await seedMahallas();

  const p = (id: string, over: Partial<PersonInsert>) => person({ id, ...over });

  await db.insert(people).values([
    // --- Дархан ---
    p("Y-2000", { mahallaId: 1, status: "Работает" }),
    p("Y-2001", { mahallaId: 1, status: "Работает" }),
    p("Y-2002", { mahallaId: 1, status: "Предприниматель" }),
    p("Y-2003", { mahallaId: 1, status: "Учится" }),
    p("Y-2004", { mahallaId: 1, status: "Учится", lastUpdate: FIXTURE_STALE }),
    // Ожидают проверки: даты разные, чтобы порядок attention был однозначным.
    p("Y-2005", {
      mahallaId: 1,
      status: "Безработный",
      neet: true,
      neetReviewStatus: "Ожидает проверки",
      lastUpdate: FIXTURE_STALE,
    }),
    p("Y-2006", {
      mahallaId: 1,
      status: "Безработный",
      neet: true,
      neetReviewStatus: "Ожидает проверки",
      lastUpdate: FIXTURE_RECENT,
    }),
    p("Y-2007", {
      mahallaId: 1,
      status: "Статус не уточнён",
      neet: true,
      neetReviewStatus: "На уточнении",
    }),
    // Направлены на программу: один NEET, второй уже с исходом.
    p("Y-2008", {
      mahallaId: 1,
      status: "Направлен на программу",
      neet: true,
      neetReviewStatus: "Подтверждено",
      program: "Профессиональное обучение",
      programOutcome: "Приступил",
      programRoutedAt: FIXTURE_RECENT,
      outcome: "В процессе",
    }),
    p("Y-2009", {
      mahallaId: 1,
      status: "Направлен на программу",
      neetReviewStatus: "Подтверждено",
      program: "Содействие в трудоустройстве",
      programOutcome: "Трудоустроен",
      programRoutedAt: FIXTURE_RECENT,
      outcome: "Трудоустроен",
    }),
    p("Y-2010", { mahallaId: 1, status: "Другая деятельность" }),
    p("Y-2011", { mahallaId: 1, status: "Работает", lastUpdate: FIXTURE_STALE }),

    // --- Буюк Ипак Йули ---
    p("Y-2012", { mahallaId: 2, status: "Работает" }),
    p("Y-2013", { mahallaId: 2, status: "Учится" }),
    p("Y-2014", {
      mahallaId: 2,
      status: "Безработный",
      neet: true,
      neetReviewStatus: "Ожидает проверки",
    }),
    // NEET с закрытой проверкой — попадает в канбан по ветке OR neet.
    p("Y-2015", { mahallaId: 2, status: "Безработный", neet: true }),
    p("Y-2016", {
      mahallaId: 2,
      status: "Направлен на программу",
      neet: true,
      neetReviewStatus: "Подтверждено",
      program: "Программа поддержки бизнеса",
      programOutcome: "Завершил",
      programRoutedAt: FIXTURE_RECENT,
      outcome: "Учится",
    }),
    // Не-NEET с открытой проверкой — попадает в канбан по второй ветке.
    p("Y-2017", {
      mahallaId: 2,
      status: "Статус не уточнён",
      neetReviewStatus: "На уточнении",
      lastUpdate: FIXTURE_STALE,
    }),
    p("Y-2018", { mahallaId: 2, status: "Предприниматель" }),
    p("Y-2019", { mahallaId: 2, status: "Другая деятельность" }),

    // --- Олтинтепа ---
    p("Y-2020", { mahallaId: 3, status: "Работает" }),
    p("Y-2021", {
      mahallaId: 3,
      status: "Безработный",
      neet: true,
      neetReviewStatus: "Ожидает проверки",
      lastUpdate: FIXTURE_OLDEST,
    }),
    p("Y-2022", {
      mahallaId: 3,
      status: "Направлен на программу",
      neetReviewStatus: "Подтверждено",
      program: "Возвращение к обучению",
      programOutcome: "Ожидает",
      programRoutedAt: FIXTURE_RECENT,
      outcome: "В процессе",
    }),
    p("Y-2023", {
      mahallaId: 3,
      status: "Статус не уточнён",
      neet: true,
      neetReviewStatus: "Подтверждено",
    }),
  ]);
}

// Подписывает JWT тем же секретом, что и приложение.
export function tokenFor(app: FastifyInstance, session: SessionPayload): string {
  return app.jwt.sign(session);
}
