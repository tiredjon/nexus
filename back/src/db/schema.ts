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
// Русские строки байт-в-байт из спеки (backend.md §6). Модель Person совпадает
// с актуальным front/src/lib/data.ts.

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
    // ФИО
    lastName: text("last_name").notNull(),
    firstName: text("first_name").notNull(),
    patronymic: text("patronymic").notNull(),
    fullName: text("full_name").notNull(),
    age: smallint("age").notNull(),
    birthDate: date("birth_date").notNull(),
    gender: text("gender").notNull(),
    mahallaId: smallint("mahalla_id")
      .notNull()
      .references(() => mahallas.id),
    streetBlock: text("street_block").notNull(),
    // Образование
    educationLevel: text("education_level").notNull(),
    educationInstitution: text("education_institution"),
    graduationYear: smallint("graduation_year"),
    specialty: text("specialty"),
    // Занятость
    status: text("status").notNull(),
    activity: text("activity").notNull(),
    employer: text("employer"),
    isFormalEmployment: boolean("is_formal_employment").notNull(),
    workExperienceMonths: smallint("work_experience_months").notNull(),
    // Навыки/направление
    skills: text("skills").array().notNull(),
    desiredDirection: text("desired_direction").notNull(),
    hasDriverLicense: boolean("has_driver_license").notNull(),
    languages: text("languages").array().notNull(),
    // Регистры
    inYoshlarDaftari: boolean("in_yoshlar_daftari").notNull(),
    inAyollarDaftari: boolean("in_ayollar_daftari").notNull(),
    familyInTemirDaftar: boolean("family_in_temir_daftar").notNull(),
    // Семья
    householdSize: smallint("household_size").notNull(),
    maritalStatus: text("marital_status").notNull(),
    hasChildren: boolean("has_children").notNull(),
    isBreadwinner: boolean("is_breadwinner").notNull(),
    // Учёт/обновление
    lastUpdate: date("last_update").notNull(),
    lastUpdateSource: text("last_update_source").notNull(),
    responsibleOfficer: text("responsible_officer").notNull(),
    needsSupport: boolean("needs_support").notNull(),
    // NEET
    neet: boolean("neet").notNull(),
    neetReviewStatus: text("neet_review_status").notNull(),
    hasProfession: boolean("has_profession").notNull(),
    businessInterest: boolean("business_interest").notNull(),
    droppedStudies: boolean("dropped_studies").notNull(),
    // Программа
    program: text("program"),
    programOutcome: text("program_outcome"),
    programRoutedAt: date("program_routed_at"),
    routedBy: text("routed_by"),
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
      "people_education_level_check",
      sql`${t.educationLevel} IN ('Среднее','Среднее специальное','Колледж','Бакалавр','Магистр')`,
    ),
    check(
      "people_desired_direction_check",
      sql`${t.desiredDirection} IN ('Трудоустройство','Профессиональное обучение','Предпринимательство','Возвращение к обучению','Не определился')`,
    ),
    check(
      "people_marital_status_check",
      sql`${t.maritalStatus} IN ('Не женат/не замужем','Женат/замужем')`,
    ),
    check(
      "people_update_source_check",
      sql`${t.lastUpdateSource} IN ('Подворный обход','Самообращение','Синхронизация реестра','Телефонный звонок','Уточнение данных','Обращение махаллинского комитета')`,
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
      "people_program_outcome_check",
      sql`${t.programOutcome} IS NULL OR ${t.programOutcome} IN ('Ожидает','Приступил','Завершил','Трудоустроен','Не явился','Отказался')`,
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
    source: text("source"),
  },
  (t) => [index("history_person_date_idx").on(t.personId, t.date)],
);
