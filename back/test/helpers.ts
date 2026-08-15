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

// Подписывает JWT тем же секретом, что и приложение.
export function tokenFor(app: FastifyInstance, session: SessionPayload): string {
  return app.jwt.sign(session);
}
