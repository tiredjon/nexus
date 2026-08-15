ALTER TABLE "history_events" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "patronymic" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "birth_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "street_block" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "education_level" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "education_institution" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "graduation_year" smallint;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "specialty" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "employer" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "is_formal_employment" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "work_experience_months" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "skills" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "desired_direction" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "has_driver_license" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "languages" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "in_yoshlar_daftari" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "in_ayollar_daftari" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "family_in_temir_daftar" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "household_size" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "marital_status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "has_children" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "is_breadwinner" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "last_update_source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "responsible_officer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "program_outcome" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "program_routed_at" date;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "routed_by" text;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_education_level_check" CHECK ("people"."education_level" IN ('Среднее','Среднее специальное','Колледж','Бакалавр','Магистр'));--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_desired_direction_check" CHECK ("people"."desired_direction" IN ('Трудоустройство','Профессиональное обучение','Предпринимательство','Возвращение к обучению','Не определился'));--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_marital_status_check" CHECK ("people"."marital_status" IN ('Не женат/не замужем','Женат/замужем'));--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_update_source_check" CHECK ("people"."last_update_source" IN ('Подворный обход','Самообращение','Синхронизация реестра','Телефонный звонок','Уточнение данных','Обращение махаллинского комитета'));--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_program_outcome_check" CHECK ("people"."program_outcome" IS NULL OR "people"."program_outcome" IN ('Ожидает','Приступил','Завершил','Трудоустроен','Не явился','Отказался'));