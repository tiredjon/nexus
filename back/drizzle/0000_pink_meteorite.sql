-- pg_trgm нужен для GIN-индекса по ФИО (ILIKE '%...%' поиск). Ставим до индексов.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "history_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "history_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"person_id" text NOT NULL,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "mahallas" (
	"id" smallint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	CONSTRAINT "mahallas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"age" smallint NOT NULL,
	"gender" text NOT NULL,
	"mahalla_id" smallint NOT NULL,
	"status" text NOT NULL,
	"activity" text NOT NULL,
	"last_update" date NOT NULL,
	"needs_support" boolean NOT NULL,
	"neet" boolean NOT NULL,
	"neet_review_status" text NOT NULL,
	"has_profession" boolean NOT NULL,
	"business_interest" boolean NOT NULL,
	"dropped_studies" boolean NOT NULL,
	"program" text,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_age_check" CHECK ("people"."age" BETWEEN 18 AND 30),
	CONSTRAINT "people_gender_check" CHECK ("people"."gender" IN ('Мужской','Женский')),
	CONSTRAINT "people_status_check" CHECK ("people"."status" IN ('Работает','Безработный','Учится','Предприниматель','Другая деятельность','Статус не уточнён','Направлен на программу')),
	CONSTRAINT "people_neet_review_check" CHECK ("people"."neet_review_status" IN ('Ожидает проверки','На уточнении','Подтверждено','Флаг снят')),
	CONSTRAINT "people_program_check" CHECK ("people"."program" IS NULL OR "people"."program" IN ('Профессиональное обучение','Содействие в трудоустройстве','Программа поддержки бизнеса','Возвращение к обучению','Молодёжная стажировка')),
	CONSTRAINT "people_outcome_check" CHECK ("people"."outcome" IS NULL OR "people"."outcome" IN ('Трудоустроен','Учится','В процессе'))
);
--> statement-breakpoint
ALTER TABLE "history_events" ADD CONSTRAINT "history_events_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_mahalla_id_mahallas_id_fk" FOREIGN KEY ("mahalla_id") REFERENCES "public"."mahallas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "history_person_date_idx" ON "history_events" USING btree ("person_id","date");--> statement-breakpoint
CREATE INDEX "people_mahalla_status_idx" ON "people" USING btree ("mahalla_id","status");--> statement-breakpoint
CREATE INDEX "people_status_idx" ON "people" USING btree ("status");--> statement-breakpoint
CREATE INDEX "people_last_update_idx" ON "people" USING btree ("last_update");--> statement-breakpoint
-- Partial- и GIN-индексы drizzle-kit не выражает декларативно — дописаны вручную (backend.md §2).
-- канбан NEET + «требуют внимания»
CREATE INDEX "people_neet_review_idx" ON "people" USING btree ("neet_review_status","last_update") WHERE "neet" = true;--> statement-breakpoint
-- аналитика по программам
CREATE INDEX "people_program_idx" ON "people" USING btree ("program") WHERE "program" IS NOT NULL;--> statement-breakpoint
-- ILIKE '%...%' поиск по ФИО
CREATE INDEX "people_full_name_trgm_idx" ON "people" USING gin ("full_name" gin_trgm_ops);