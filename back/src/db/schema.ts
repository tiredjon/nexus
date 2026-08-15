import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  doublePrecision,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Все доменные значения — text + CHECK (не PG-энумы: их ALTER'ы ломают миграции).
// Русские строки байт-в-байт из спеки (backend.md, раздел 6).

export const mahallas = pgTable("mahallas", {
  id: smallint("id").primaryKey(), // 1..12, фиксированный порядок из MAHALLAS
  name: text("name").notNull().unique(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(), // формат Y-<n>, начиная с Y-1000
    fullName: text("full_name").notNull(),
    age: smallint("age").notNull(),
    gender: text("gender").notNull(),
    mahallaId: smallint("mahalla_id")
      .notNull()
      .references(() => mahallas.id),
    status: text("status").notNull(),
    activity: text("activity").notNull(),
    lastUpdate: date("last_update").notNull(),
    needsSupport: boolean("needs_support").notNull(),
    neet: boolean("neet").notNull(),
    neetReviewStatus: text("neet_review_status").notNull(),
    hasProfession: boolean("has_profession").notNull(),
    businessInterest: boolean("business_interest").notNull(),
    droppedStudies: boolean("dropped_studies").notNull(),
    program: text("program"),
    outcome: text("outcome"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("people_age_check", sql`${t.age} BETWEEN 18 AND 30`),
    check("people_gender_check", sql`${t.gender} IN ('Мужской','Женский')`),
    check(
      "people_status_check",
      sql`${t.status} IN ('Работает','Безработный','Учится','Предприниматель','Другая деятельность','Статус не уточнён','Направлен на программу')`,
    ),
    check(
      "people_neet_review_check",
      sql`${t.neetReviewStatus} IN ('Ожидает проверки','На уточнении','Подтверждено','Флаг снят')`,
    ),
    check(
      "people_program_check",
      sql`${t.program} IS NULL OR ${t.program} IN ('Профессиональное обучение','Содействие в трудоустройстве','Программа поддержки бизнеса','Возвращение к обучению','Молодёжная стажировка')`,
    ),
    check(
      "people_outcome_check",
      sql`${t.outcome} IS NULL OR ${t.outcome} IN ('Трудоустроен','Учится','В процессе')`,
    ),
    index("people_mahalla_status_idx").on(t.mahallaId, t.status),
    index("people_status_idx").on(t.status),
    index("people_last_update_idx").on(t.lastUpdate),
  ],
);

export const historyEvents = pgTable(
  "history_events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    title: text("title").notNull(),
    note: text("note"),
  },
  (t) => [index("history_person_date_idx").on(t.personId, t.date)],
);
