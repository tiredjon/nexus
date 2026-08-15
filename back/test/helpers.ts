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

// Детерминированный фикстур: ~30 человек с известными параметрами для точных ассертов.
export async function seedFixture(): Promise<void> {
  await seedMahallas();

  const now = new Date().toISOString().slice(0, 10);
  const staleDays = new Date(Date.now() - 100 * 86400000).toISOString().slice(0, 10);
  const recentDays = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);

  const fixture = [
    // Дархан (махалла id=1): работающие
    {
      id: "Y-1000",
      fullName: "Каримов Азиз угли",
      age: 22,
      gender: "Мужской" as const,
      mahallaId: 1,
      status: "Работает",
      activity: "Программист",
      lastUpdate: now,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: true,
      businessInterest: false,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    {
      id: "Y-1001",
      fullName: "Юсупова Нилуфар кизи",
      age: 20,
      gender: "Женский" as const,
      mahallaId: 1,
      status: "Работает",
      activity: "Швея",
      lastUpdate: recentDays,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: true,
      businessInterest: false,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    // Дархан: NEET
    {
      id: "Y-1002",
      fullName: "Рахимов Жасур угли",
      age: 25,
      gender: "Мужской" as const,
      mahallaId: 1,
      status: "Безработный",
      activity: "Ищет работу",
      lastUpdate: staleDays,
      needsSupport: true,
      neet: true,
      neetReviewStatus: "Ожидает проверки" as const,
      hasProfession: false,
      businessInterest: true,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    {
      id: "Y-1003",
      fullName: "Абдуллаева Мадина кизи",
      age: 19,
      gender: "Женский" as const,
      mahallaId: 1,
      status: "Статус не уточнён",
      activity: "Данные не подтверждены",
      lastUpdate: now,
      needsSupport: false,
      neet: true,
      neetReviewStatus: "На уточнении" as const,
      hasProfession: false,
      businessInterest: false,
      droppedStudies: true,
      program: null,
      outcome: null,
    },
    // Дархан: направлены на программу
    {
      id: "Y-1004",
      fullName: "Тошматова Зилола кизи",
      age: 21,
      gender: "Женский" as const,
      mahallaId: 1,
      status: "Направлен на программу",
      activity: "Профессиональное обучение",
      lastUpdate: recentDays,
      needsSupport: true,
      neet: true,
      neetReviewStatus: "Подтверждено" as const,
      hasProfession: false,
      businessInterest: false,
      droppedStudies: false,
      program: "Профессиональное обучение",
      outcome: "В процессе",
    },
    // Буюк Ипак Йули (махалла id=2): учится
    {
      id: "Y-1005",
      fullName: "Нортожиева Дилноза кизи",
      age: 18,
      gender: "Женский" as const,
      mahallaId: 2,
      status: "Учится",
      activity: "ТУИТ, 3 курс",
      lastUpdate: now,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: false,
      businessInterest: false,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    {
      id: "Y-1006",
      fullName: "Эргашева Гулнора кизи",
      age: 20,
      gender: "Женский" as const,
      mahallaId: 2,
      status: "Учится",
      activity: "Колледж связи",
      lastUpdate: staleDays,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: false,
      businessInterest: false,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    // Буюк Ипак Йули: предприниматель
    {
      id: "Y-1007",
      fullName: "Мирзаев Бекзод угли",
      age: 28,
      gender: "Мужской" as const,
      mahallaId: 2,
      status: "Предприниматель",
      activity: "Швейный цех",
      lastUpdate: now,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: true,
      businessInterest: true,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    // Олтинтепа (махалла id=3): старшие
    {
      id: "Y-1008",
      fullName: "Хамидова Севара кизи",
      age: 30,
      gender: "Женский" as const,
      mahallaId: 3,
      status: "Работает",
      activity: "Логист",
      lastUpdate: recentDays,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: true,
      businessInterest: false,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
    {
      id: "Y-1009",
      fullName: "Салимова Шахноза кизи",
      age: 29,
      gender: "Женский" as const,
      mahallaId: 3,
      status: "Другая деятельность",
      activity: "Уход за ребёнком",
      lastUpdate: now,
      needsSupport: false,
      neet: false,
      neetReviewStatus: "Флаг снят" as const,
      hasProfession: false,
      businessInterest: false,
      droppedStudies: false,
      program: null,
      outcome: null,
    },
  ];

  // Вставим батчем.
  await db.insert(people).values(fixture);

  // Добавим историю для некоторых.
  await db.insert(historyEvents).values([
    {
      personId: "Y-1000",
      date: staleDays,
      title: "Первичный учёт в реестре махалли",
    },
    {
      personId: "Y-1002",
      date: staleDays,
      title: "Собеседование с инспектором махалли",
    },
    {
      personId: "Y-1002",
      date: now,
      title: "Статус подтверждён сотрудником",
    },
    {
      personId: "Y-1004",
      date: recentDays,
      title: "Направлен на программу: Профессиональное обучение",
    },
  ]);
}

// Подписывает JWT тем же секретом, что и приложение.
export function tokenFor(app: FastifyInstance, session: SessionPayload): string {
  return app.jwt.sign(session);
}
