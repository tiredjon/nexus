# Yoshlar Radar — Backend (спецификация и прогресс)

> Этот документ — единственный источник правды по бэкенду. Каждая новая сессия
> читает **сначала `CLAUDE.md`, потом весь этот файл целиком** и выполняет ровно
> одну сессию из раздела «Сессии реализации». Ничего не придумывай сверх спеки;
> если что-то невозможно — сделай минимальное отклонение и опиши его в разделе
> «Прогресс».

Бэкенд живёт в новом каталоге верхнего уровня **`back/`**. Фронт (`front/`) в
этих сессиях **не трогаем** — пишем только API и контракт. Данные синтетические.

---

## 0. Обязательные правила для КАЖДОЙ сессии (читать первым)

1. **Порядок работы**: прочитай `CLAUDE.md` + весь `back/backend.md`. Найди свою
   сессию в разделе «Сессии реализации», делай только её.
2. **Не трогай `front/`** ни одним файлом. Не занимай порты `8080`/`8081`
   (это фронт). Бэкенд слушает `3001`, dev-Postgres — `5438`.
3. **Git flow**: ветка `back/s<N>-<slug>` от свежего `main`. Прямой push в `main`
   запрещён. PR через `gh pr create`. Мерж только когда **все чеки зелёные**
   (`gh pr checks --watch`), затем `gh pr merge --squash --delete-branch`. Если
   CI красный — чини в той же ветке, не мержи.
   > ⚠️ Ветка `main` в этом репо **не защищена** — GitHub не заблокирует мерж с
   > красным CI и не потребует ревью. Дисциплина «жду зелёного, мержу через PR» —
   > на тебе. Не используй `--auto` (без required-checks он смержит сразу); всегда
   > сперва `gh pr checks --watch`, убедись, что всё зелёное, и только потом
   > `gh pr merge --squash --delete-branch`. Права ADMIN есть, ревью не нужно.
4. **Коммить только своё**: `git add back/ .github/ backend.md CLAUDE.md`. Никогда
   не делай `git add -A` — в рабочем дереве есть несвязанные изменения по фронту.
   Проверяй `git status` перед коммитом.
   - **Лок-файл обязателен.** CI гоняет `npm ci`, который падает без
     `back/package-lock.json` и при рассинхроне с `package.json`. Поэтому: как
     только меняешь зависимости — запусти `npm install` в `back/` и **закоммить
     обновлённый `back/package-lock.json`** вместе с `package.json`. В S1 это
     первый шаг (см. ниже), иначе самый первый прогон CI сразу красный.
5. **Тесты обязательны** для каждого нового эндпоинта: happy-path + `400`
   (плохой ввод) + `401`/`403` (доступ) + `404` где применимо. Тесты гоняются
   через `app.inject()` против реального Postgres; БД чистится `TRUNCATE` в
   `beforeEach`; в `vitest.config.ts` держи `fileParallelism: false` — не убирай.
6. **Локальная проверка перед PR** (из каталога `back/`):
   `docker compose up -d` → `npm run migrate` → `npm run seed` →
   `npm run typecheck` → `npm test`. Всё зелёное — только тогда PR.
7. **Никакой обработки данных в JS по загруженным строкам.** Вся фильтрация,
   сортировка, пагинация и агрегация — в SQL. Это часть питча про большие данные.
8. **Русские доменные строки — байт-в-байт** как в `back/src/db/constants.ts`
   (статусы, программы, названия махаллей, заголовки истории). Не переводить, не
   «исправлять» буквы ё/е, не менять регистр.
9. **В конце сессии в том же PR**: отметь сессию выполненной в разделе
   «Прогресс» (что сделано, номер PR, отклонения) и обнови секцию «Бэкенд» в
   `CLAUDE.md` (кратко: что уже работает, как запустить).

---

## 1. Технологический стек (зафиксирован — не менять)

| Что | Выбор | Почему именно так |
|---|---|---|
| Рантайм | **Node 22 + TypeScript**, ESM (`"type": "module"` в package.json) | Совпадает с тулингом фронта; есть на раннерах GitHub Actions. |
| HTTP | **Fastify 5** | Тесты гоняются через `app.inject()` — без портов и flaky-сети. `buildApp()`/`listen` разнесены. |
| Валидация | **zod 3**, вызывается вручную в хендлере: `Schema.safeParse(req.query)` | Не использовать `fastify-type-provider-zod` и JSON-schema Fastify — там путаются дженерики. Просто `safeParse` → при ошибке ранний `400`. |
| БД | **PostgreSQL 16** | История про большие данные требует настоящую СУБД с индексами, `pg_trgm`, `FILTER (WHERE …)`. |
| Доступ к БД | **Drizzle ORM** + `pg` Pool (`drizzle-orm/node-postgres`). Миграции — `drizzle-kit generate`, коммитятся в репо, применяются `scripts/migrate.ts`. | Drizzle SQL-образный, `and(...conditions)` строит динамический WHERE без ручного счёта `$1..$n`. Для агрегатов — сырой `sql` тег. Без бинарных движков (в отличие от Prisma). |
| Auth | **`@fastify/jwt`**, HS256, секрет из `JWT_SECRET` | Один плагин, один `authenticate` preHandler. |
| Тесты | **vitest** + `app.inject()` против **реального Postgres** (docker-compose локально, service-контейнер в CI). НЕ testcontainers, НЕ pg-mem. | Только реальный PG выполняет тот же SQL, что уедет в прод (нам нужны `pg_trgm`, partial-индексы, `FILTER`). |
| Dev-БД | `back/docker-compose.yml`, `postgres:16-alpine`, host-порт **5438** | Не конфликтует с локальным 5432. |
| Запуск | `tsx watch src/index.ts` (dev), `tsx src/index.ts` (start). Билд-шага нет. | Убирает класс багов с путями ESM/dist. |

**Точные версии (пинить в S1):** `fastify@^5`, `@fastify/jwt@^9`, `drizzle-orm@^0.44`,
`drizzle-kit@^0.31`, `pg@^8`, `zod@^3.25`, `vitest@^3`, `tsx@^4`, `typescript@^5.8`,
`@types/pg`, `@types/node`.

**`back/package.json` scripts (контракт, не переименовывать):**
```json
{
  "dev": "tsx watch src/index.ts",
  "start": "tsx src/index.ts",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "migrate": "tsx scripts/migrate.ts",
  "seed": "tsx scripts/seed.ts",
  "db:generate": "drizzle-kit generate",
  "bench": "tsx scripts/bench.ts"
}
```

**Env (`back/.env.example`):**
```
DATABASE_URL=postgres://postgres:postgres@localhost:5438/nexus
PORT=3001
JWT_SECRET=dev-secret
```
`src/config.ts` парсит env через zod; вне `NODE_ENV=production` дефолт
`JWT_SECRET=dev-secret` допустим.

---

## 2. Схема базы данных

Все доменные значения храним как `text` + `CHECK` (НЕ PG-энумы — их ALTER'ы
ломают миграции). Названия махаллей и статусы — точные русские строки из
`constants.ts` (раздел 6).

**Миграция 0000 в начале:** `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

### Таблица `mahallas`
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | `smallint` | PK, значения 1..12 (фиксированный порядок из `MAHALLAS`) |
| `name` | `text` | NOT NULL, UNIQUE |
| `lat` | `double precision` | NOT NULL |
| `lng` | `double precision` | NOT NULL |

Сидится из `MAHALLAS` + `MAHALLA_COORDS`. **id = позиция в `MAHALLAS` + 1**:
`Дархан=1, Буюк Ипак Йули=2, Олтинтепа=3, Элобод=4, Гулзор=5, Мингбулок=6,
Юзработ=7, Козиробод=8, Мустакиллик=9, Бахор=10, Салар=11, Шахрисабз=12`.

### Таблица `people`
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | `text` | PK, формат `Y-<n>` начиная с `Y-1000` |
| `full_name` | `text` | NOT NULL |
| `age` | `smallint` | NOT NULL, `CHECK (age BETWEEN 18 AND 30)` |
| `gender` | `text` | NOT NULL, `CHECK (gender IN ('Мужской','Женский'))` |
| `mahalla_id` | `smallint` | NOT NULL, FK → `mahallas(id)` |
| `status` | `text` | NOT NULL, `CHECK` ∈ 7 статусов |
| `activity` | `text` | NOT NULL |
| `last_update` | `date` | NOT NULL |
| `needs_support` | `boolean` | NOT NULL |
| `neet` | `boolean` | NOT NULL |
| `neet_review_status` | `text` | NOT NULL, `CHECK` ∈ 4 review-статусов |
| `has_profession` | `boolean` | NOT NULL |
| `business_interest` | `boolean` | NOT NULL |
| `dropped_studies` | `boolean` | NOT NULL |
| `program` | `text` | NULL, `CHECK (program IS NULL OR program IN (…5 программ…))` |
| `outcome` | `text` | NULL, `CHECK (outcome IS NULL OR outcome IN ('Трудоустроен','Учится','В процессе'))` |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

### Таблица `history_events`
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `person_id` | `text` | NOT NULL, FK → `people(id)` `ON DELETE CASCADE` |
| `date` | `date` | NOT NULL |
| `title` | `text` | NOT NULL |
| `note` | `text` | NULL |

### Индексы (история про большие данные — коммент к каждому в миграции)
```sql
CREATE INDEX people_mahalla_status_idx ON people (mahalla_id, status);      -- скоуп-списки, group-by карты/дашборда
CREATE INDEX people_status_idx         ON people (status);                  -- распределение по статусам
CREATE INDEX people_last_update_idx    ON people (last_update);             -- фильтр/сортировка по устареванию
CREATE INDEX people_neet_review_idx    ON people (neet_review_status, last_update) WHERE neet = true;  -- канбан + «требуют внимания»
CREATE INDEX people_program_idx        ON people (program) WHERE program IS NOT NULL;                  -- аналитика по программам
CREATE INDEX people_full_name_trgm_idx ON people USING gin (full_name gin_trgm_ops);                   -- ILIKE '%...%' поиск по ФИО
CREATE INDEX history_person_date_idx   ON history_events (person_id, date);
```
`drizzle-kit generate` не выразит partial- и GIN-индексы декларативно — сгенери
миграцию, затем **вручную допиши эти `CREATE INDEX` и `CREATE EXTENSION` в тот
же `.sql`-файл** (это обычный SQL, редактировать можно).

---

## 3. Контракт REST API (полный)

**Общее:** префикс `/api` у всех, кроме `GET /health`. JSON везде. Auth =
заголовок `Authorization: Bearer <jwt>` на всех, кроме `/health` и
`/api/auth/login`. **Форма ошибки всегда:**
```json
{ "error": { "code": "BAD_REQUEST", "message": "…" } }
```
`code` ∈ `BAD_REQUEST(400)`, `UNAUTHORIZED(401)`, `FORBIDDEN(403)`,
`NOT_FOUND(404)`, `INTERNAL(500)`.

**JWT payload:** `{ role: "district" | "mahalla", mahalla: string | null }`
(`mahalla` — **имя** махалли, как в `yr-session` фронта), TTL 12 часов.

**Правило скоупа (единый helper `resolveScope(req)` в `lib/scope.ts`):**
- `role="district"` → видит всех; необязательный `?mahalla=<имя>` в списках
  фильтрует по этой махалле.
- `role="mahalla"` → все чтения принудительно `WHERE mahalla_id = <своя>`; если
  в запросе `?mahalla=` и он ≠ своей махалли → **403**. Любая мутация над
  человеком из чужой махалли → **403**.

**Сериализация `Person` (совпадает с типом фронта):** `mahalla` отдаётся
**именем-строкой** (JOIN на `mahallas`), не id. camelCase ключи. `history`
только в `GET /api/people/:id`, отсортирована `date ASC, id ASC`.

`PersonListItem` = все скалярные поля Person в camelCase (`id, fullName, age,
gender, mahalla, status, activity, lastUpdate, needsSupport, neet,
neetReviewStatus, hasProfession, businessInterest, droppedStudies, program,
outcome`), **без** `history`.

### Список эндпоинтов

**1. `GET /health`** — auth нет. Выполняет `SELECT 1`. `200 {"status":"ok","db":"ok"}`,
при недоступной БД `503 {"status":"error","db":"down"}`.

**2. `POST /api/auth/login`** — auth нет. Тело:
`{"role":"district"}` или `{"role":"mahalla","mahalla":"Дархан"}`. Неизвестная
махалля или `mahalla` без роли `mahalla` → `400`. Ответ `200`:
`{"token":"<jwt>","session":{"role":"…","mahalla":"…"|null}}`.

**3. `GET /api/auth/me`** — auth. Ответ `{"role":"…","mahalla":"…"|null}`.

**4. `GET /api/meta/mahallas`** — auth. Ответ `[{id,name,lat,lng}]` (12 шт,
порядок по `id`).

**5. `GET /api/meta/dictionaries`** — auth. Ответ
`{"statuses":[…7],"reviewStatuses":[…4],"programs":[…5],"genders":["Мужской","Женский"],"outcomes":["Трудоустроен","Учится","В процессе"]}`.

**6. `GET /api/people`** — auth (авто-скоуп). Query-параметры (все опциональны):

| Параметр | Тип / значения | Семантика (как во фронте) |
|---|---|---|
| `query` | string | `full_name ILIKE '%' \|\| trim(query) \|\| '%'` |
| `mahalla` | имя махалли | фильтр (district); для mahalla-роли см. скоуп |
| `status` | один из 7 статусов | `status = ?` |
| `ageMin` | int 18..30 (деф. 18) | `age >= ?` |
| `ageMax` | int 18..30 (деф. 30) | `age <= ?` |
| `neet` | `true` | `neet = true` |
| `needsSupport` | `true` | `needs_support = true` |
| `stale` | `true` | `last_update < CURRENT_DATE - 90` |
| `sort` | `fullName\|age\|mahalla\|lastUpdate` (деф. `fullName`) | whitelist-мапа колонок; `mahalla` → `mahallas.name` |
| `order` | `asc\|desc` (деф. `asc`) | направление |
| `page` | int ≥ 1 (деф. 1) | пагинация |
| `pageSize` | int 1..200 (деф. 50) | размер страницы |

Сортировку по текстовым полям делай с русской коллацией: `ORDER BY full_name
COLLATE "ru-RU-x-icu"` (и аналогично `mahallas.name`). Значение `sort`/`order`
только из whitelist — **никогда** не интерполируй ввод в `ORDER BY`.
Ответ `200`: `{"items":[PersonListItem],"total":N,"page":P,"pageSize":S,"totalPages":T}`.
`total` — отдельным `SELECT count(*)` с тем же WHERE (две query — так проще).

**7. `GET /api/people/:id`** — auth, скоуп (чужая махалля → 403, нет записи → 404).
Ответ — полный `Person` с `history:[{date,title,note}]` (`note` может быть `null`).

**8. `POST /api/people/:id/route-to-program`** — auth, скоуп. Тело
`{"program":"<одна из 5>","comment":"…"?}`. Невалидная программа → 400.
В **одной транзакции**: `program=?`, `status='Направлен на программу'`,
`outcome='В процессе'`, `neet_review_status='Подтверждено'`,
`last_update=<сегодня>`; вставить history
`{date:<сегодня>, title:'Направлен на программу: <program>', note: comment ?? null}`.
Ответ — обновлённый полный `Person`.

**9. `POST /api/people/:id/confirm-status`** — auth, скоуп. Тело `{}`.
`last_update=<сегодня>`; **если `neet=true`** → `neet_review_status='Подтверждено'`
(иначе не трогать); вставить history
`{date:<сегодня>, title:'Статус подтверждён сотрудником'}`. Ответ — `Person`.

**10. `POST /api/people/:id/request-clarification`** — auth, скоуп. Тело `{}`.
`neet_review_status='На уточнении'`; вставить history
`{date:<сегодня>, title:'Запрошено уточнение данных'}`.
**`last_update` НЕ меняется** (во фронте эта мутация его не трогает). Ответ — `Person`.

**11. `PATCH /api/people/:id/review-status`** — auth, скоуп. Тело
`{"status":"<один из 4 review-статусов>"}`. Невалидный статус → 400.
`neet_review_status=?`, `last_update=<сегодня>`; вставить history
`{date:<сегодня>, title:'Проверка NEET: <status>'}`. Ответ — `Person`.

> «сегодня» = `CURRENT_DATE` в SQL / `new Date().toISOString().slice(0,10)`.

**12. `GET /api/stats/dashboard`** — auth (авто-скоуп). Ответ:
```jsonc
{
  "kpi": { "total":N, "employed":N, "unemployed":N, "neet":N, "unknown":N, "stale":N },
  "byStatus": [ {"status":"Работает","count":N}, … ],          // все 7 в порядке STATUSES
  "byMahalla": [ {"mahalla":"Дархан","employed":N,"studying":N,"neet":N,"other":N}, … ],
  "neetTrend": [ {"month":"Март","neet":N}, … ],               // 6 месяцев
  "attention": [ PersonListItem, … ]                           // ≤ 5
}
```
Формулы (SQL, `count(*) FILTER (WHERE …)`, `GROUP BY mahalla_id`):
- `employed` = `status IN ('Работает','Предприниматель')`
- `unemployed` = `status = 'Безработный'`
- `neet` = `neet = true`
- `unknown` = `status = 'Статус не уточнён'`
- `stale` = `last_update < CURRENT_DATE - 90`
- `byMahalla.studying` = `status = 'Учится'`;
  `byMahalla.other` = `status IN ('Другая деятельность','Направлен на программу')`
  (это **не** «всё остальное» — именно эти два статуса; поля пересекаются с neet).
- `attention` = `WHERE neet AND neet_review_status='Ожидает проверки'
  ORDER BY last_update ASC LIMIT 5` (самые «протухшие» первыми).
- `neetTrend`: `months=["Март","Апрель","Май","Июнь","Июль","Август"]`,
  `T = count(*) FILTER (WHERE neet)`, для `i=0..5`:
  `neet_i = round(T*(1.22 - i*0.04) + ((i*7) % 5))`. Считается в JS из одного числа `T`.

**13. `GET /api/stats/map`** — auth (авто-скоуп). Ответ
`[{"mahalla":"…","lat":…,"lng":…,"total":N,"employed":N,"neet":N,"share":P}, …]`.
`employed` = `Работает|Предприниматель`; `share` = `total>0 ? round(neet/total*100, 1) : 0`
(процент, одна десятичная). Для mahalla-роли — только своя махалля.

**14. `GET /api/stats/review`** — auth (авто-скоуп). Ответ
`{"columns":[{"status":"<review-статус>","items":[PersonListItem]}, …]}` — 4 колонки
в порядке `REVIEW_STATUSES`. Множество кейсов: `WHERE neet = true OR
neet_review_status <> 'Флаг снят'`. Внутри колонки — те, у кого
`neet_review_status = <статус колонки>`, `ORDER BY last_update ASC, id ASC`,
не больше 40 на колонку.

**15. `GET /api/stats/analytics`** — auth (авто-скоуп). Ответ:
```jsonc
{
  "funnel": [
    {"stage":"Выявлен","value":N},
    {"stage":"Проверен","value":N},
    {"stage":"Направлен на программу","value":N},
    {"stage":"Трудоустроен / учится","value":N}
  ],
  "programs": [ {"program":"…","sent":N,"ok":N,"rate":P}, … ],   // все 5 в порядке PROGRAMS
  "monthly":  [ {"month":"Март","routed":N,"employed":N}, … ]    // 6 месяцев
}
```
Формулы:
- `Выявлен` = `neet OR status='Направлен на программу'`
- `Проверен` = `neet_review_status IN ('Подтверждено','На уточнении')`
- `Направлен на программу` (`routed`) = `program IS NOT NULL`
- `Трудоустроен / учится` (`succeeded`) = `outcome IN ('Трудоустроен','Учится')`
- `programs[k]`: `sent = count(program = prog)`, `ok = count(program=prog AND
  outcome IN ('Трудоустроен','Учится'))`, `rate = sent>0 ? round(ok/sent*100) : 0`
- `monthly` (JS из чисел `routed`, `succeeded`), `i=0..5`:
  `routed_i = max(3, round(routed/6 + ((i*5) % 7) - 2))`,
  `employed_i = max(1, round(succeeded/6 + ((i*3) % 5) - 1))`.

> Профиль человека во фронте (`/person/:id`) сам считает «предложения программ»
> из полей `hasProfession/businessInterest/droppedStudies/status` — отдельный
> эндпоинт для этого **не нужен**, всё есть в ответе п.7.

---

## 4. Раскладка каталога `back/`

```
back/
  package.json  tsconfig.json  vitest.config.ts  drizzle.config.ts
  docker-compose.yml  .env.example
  drizzle/                       # сгенерированные .sql миграции (коммитятся)
  scripts/
    migrate.ts                   # применяет миграции (drizzle migrate())
    seed.ts                      # сидер (порт generatePeople + махалли)
    bench.ts                     # S6: замер p50/p95 по эндпоинтам
  src/
    index.ts                     # только listen()
    app.ts                       # buildApp(): регистрирует всё, возвращает Fastify
    config.ts                    # zod-парсинг env
    db/
      client.ts                  # pg Pool + drizzle()
      schema.ts                  # Drizzle-схема всех таблиц
      constants.ts               # русские константы + пулы имён (порт из data.ts)
    plugins/
      auth.ts                    # @fastify/jwt + decorate('authenticate') 
    lib/
      errors.ts                  # httpError(code,message) + errorHandler
      scope.ts                   # resolveScope(req) → {mahallaId|null, role}
      serialize.ts               # toPersonListItem / toPerson (JOIN mahalla name)
    routes/
      health.ts  auth.ts  meta.ts  people.ts  mutations.ts  stats.ts
  test/
    helpers.ts                   # buildApp, truncateAll, seedFixture, tokenFor()
    health.test.ts  auth.test.ts  people.test.ts  mutations.test.ts  stats.test.ts
```

---

## 5. Сессии реализации (6 штук)

Каждая сессия = ветка `back/s<N>-<slug>` → код + тесты → зелёный локальный
прогон → PR → зелёный CI → merge → обновить «Прогресс» + `CLAUDE.md`.

### S1 — Скаффолд, схема БД, `/health`, CI (`back/s1-scaffold`)
**Создать:** весь каркас из раздела 4, кроме `routes/{people,mutations,stats}.ts`,
`bench.ts` и людской части сидера.
- `package.json` (scripts из раздела 1, версии пинить), затем **`npm install` →
  закоммить `back/package-lock.json`** (без него CI-шаг `npm ci` красный),
  `tsconfig.json` (ESM, `strict`, `noEmit`), `docker-compose.yml`
  (postgres:16-alpine, порт `5438`, db `nexus`, user/pass `postgres`),
  `.env.example`, `drizzle.config.ts`.
- `src/db/schema.ts` — все 3 таблицы. `npx drizzle-kit generate` → миграция 0000;
  **вручную** допиши в неё `CREATE EXTENSION pg_trgm` и 7 индексов (раздел 2).
- `scripts/migrate.ts`. `scripts/seed.ts` **v1** — только upsert 12 махаллей.
- `src/config.ts`, `src/db/client.ts`, `src/lib/errors.ts`, `src/app.ts`,
  `src/index.ts`, `src/routes/health.ts` (эндпоинт п.1 с `SELECT 1`).
- `test/helpers.ts` (`buildApp`, `truncateAll`) + `test/health.test.ts`
  (2 теста: `200` и форма ответа; content-type json).
- `.github/workflows/backend-ci.yml` — раздел 7. Без paths-фильтра (должен
  запускаться на каждый PR, чтобы у защиты ветки всегда был чек).
**DoD:** локально `docker compose up -d && npm run migrate && npm run seed &&
npm run dev` работает; `curl :3001/health` → ok; `back/package-lock.json`
закоммичен; CI зелёный (включая шаг boot+curl).

### S2 — Auth + полный детерминированный сидер (`back/s2-auth-seed`)
- `src/db/constants.ts` — порт из `front/src/lib/data.ts` **дословно**: массивы
  `MAHALLAS`, `MAHALLA_COORDS`, `STATUSES`, `REVIEW_STATUSES`, `PROGRAMS`, пулы
  `MALE/FEMALE/SURNAMES/PATRON/JOBS/STUDIES/BUSINESS/OTHER`, функция `mulberry32`.
- `src/plugins/auth.ts` (`@fastify/jwt`, preHandler `authenticate`),
  `src/lib/scope.ts` (`resolveScope`), `src/routes/auth.ts` (пп.2–3),
  `src/routes/meta.ts` (пп.4–5).
- `scripts/seed.ts` **v2** — порт `generatePeople()` из `data.ts` дословно (seed
  `mulberry32(20260814)`, те же распределения статусов, тот же вывод neet,
  истории, второй проход по программам). Даты: вместо `Date.now()` использовать
  `--anchor YYYY-MM-DD` (по умолчанию сегодня), чтобы прогоны были
  воспроизводимы. Флаги: `--count N` (деф. 250), `--anchor`, `--append`
  (иначе перед сидом `TRUNCATE people, history_events`), `--lightHistory`
  (≤2 события/чел — для больших объёмов). Вставка батчами по 1000 строк
  (сначала people, потом history) в транзакции на батч. `mahalla` → `mahalla_id`
  через словарь имя→id.
- Тесты: оба логина (`district`, `mahalla`), плохая махалля → 400, `mahalla` без
  роли → 400, отсутствие токена на `/api/meta/mahallas` → 401, round-trip
  `/api/auth/me`, форма `/api/meta/dictionaries`. Сид-тест: `seed --count 50`
  в тестовую БД → ровно 50 people, есть history-строки, все статусы валидны.
**DoD:** `npm run seed -- --count 250` и `--count 5000` отрабатывают.

### S3 — Реестр: `GET /api/people` + `GET /api/people/:id` (`back/s3-registry`)
- `src/lib/serialize.ts` (`toPersonListItem`, `toPerson` c JOIN на имя махалли
  и подгрузкой history), `src/routes/people.ts` (пп.6–7).
- Динамический WHERE через drizzle `and(...conds)`; `total` — второй
  `count(*)`-запрос; whitelist-мапа сортировок; русская коллация в ORDER BY.
- Тесты (фикстура ~30 людей через `seedFixture` в helpers — **детерминированная,
  не случайный сидер**): каждый фильтр по отдельности; комбинация фильтров;
  `stale`; арифметика пагинации (`total`/`totalPages`); каждая `sort × order`;
  ILIKE-поиск (подстрока, регистронезависимо); district `?mahalla=`;
  mahalla-роль — принудительный скоуп; mahalla-роль просит чужую махаллю → 403;
  `:id` найден / 404 / чужая махалля 403; история отсортирована.
**DoD:** ~15+ тестов зелёные.

### S4 — Мутации (`back/s4-mutations`)
- `src/routes/mutations.ts` (пп.8–11). Каждая: загрузить person `FOR UPDATE`
  внутри `db.transaction`, проверить скоуп (403), применить обновления полей +
  вставить history + (где нужно) `last_update`, вернуть полный `Person` через
  `toPerson`.
- Тесты по каждому эндпоинту: эффекты на поля, добавленная history-строка с
  точным `title`, изменение/неизменение `last_update` (внимание: у
  `request-clarification` НЕ меняется), форма ответа; 404 неизвестный id; 403
  чужая махалля; 400 невалидная программа / невалидный review-статус;
  `confirm-status` на не-NEET **не** трогает `neet_review_status`.
**DoD:** ~14+ тестов зелёные.

### S5 — Агрегаты: `/api/stats/*` (`back/s5-stats`)
- `src/routes/stats.ts` (пп.12–15) на сыром `sql` с `count(*) FILTER (WHERE …)`
  и `GROUP BY mahalla_id`; формулы из раздела 3 дословно; `neetTrend` и `monthly`
  добираются в JS из чисел.
- Тесты: фикстура ~24 человека с известным составом → точные числа KPI, строки
  `byMahalla`, `share` карты (в т.ч. деление на 0 → 0), 4 колонки канбана
  (состав + порядок), числа воронки, `rate` программ (в т.ч. 0 при `sent=0`),
  формула тренда; для mahalla-роли каждый показатель сужается до её махалли.
**DoD:** дашборд для mahalla-роли возвращает только её срез.

### S6 — Демо больших данных + полировка (`back/s6-bigdata`)
- `scripts/bench.ts`: против запущенного сервера дёргает `/api/people`
  (с фильтром+поиском+пагинацией), `/api/stats/dashboard`, `/api/stats/map` по N
  раз, печатает p50/p95 (мс) таблицей.
- Проверить сидер на `--count 100000 --lightHistory` (ориентир < ~60 c).
- Добавить в этот файл раздел «Демо больших данных»: точные команды, ожидаемые
  тайминги, 2 транскрипта `EXPLAIN (ANALYZE, BUFFERS)` на 100k строк
  (trigram-поиск по ФИО и group-by дашборда), talk-track для жюри.
- Починить всё, что вскроет EXPLAIN. Это буферная сессия — сюда же уезжает
  недоделанное из S3–S5.
**DoD:** вывод `bench` вставлен в backend.md; CI зелёный.

---

## 6. Русские константы (источник — `front/src/lib/data.ts`, копировать точно)

```
MAHALLAS (id = индекс+1):
  Дархан, Буюк Ипак Йули, Олтинтепа, Элобод, Гулзор, Мингбулок,
  Юзработ, Козиробод, Мустакиллик, Бахор, Салар, Шахрисабз

MAHALLA_COORDS [lat, lng]:
  Дархан [41.3455,69.3105]  Буюк Ипак Йули [41.3282,69.3208]
  Олтинтепа [41.3521,69.3402]  Элобод [41.3388,69.3555]
  Гулзор [41.3215,69.3465]  Мингбулок [41.3608,69.3255]
  Юзработ [41.3172,69.3302]  Козиробод [41.3345,69.3712]
  Мустакиллик [41.3492,69.3628]  Бахор [41.3105,69.3585]
  Салар [41.3268,69.3021]  Шахрисабз [41.3572,69.3495]

STATUSES: Работает, Безработный, Учится, Предприниматель,
          Другая деятельность, Статус не уточнён, Направлен на программу

REVIEW_STATUSES: Ожидает проверки, На уточнении, Подтверждено, Флаг снят

PROGRAMS: Профессиональное обучение, Содействие в трудоустройстве,
          Программа поддержки бизнеса, Возвращение к обучению,
          Молодёжная стажировка

GENDER: Мужской, Женский          OUTCOME: Трудоустроен, Учится, В процессе

Заголовки истории (мутации):
  route-to-program        → "Направлен на программу: <program>" (+ note = comment|null)
  confirm-status          → "Статус подтверждён сотрудником"
  request-clarification   → "Запрошено уточнение данных"
  review-status           → "Проверка NEET: <status>"
Сидовые заголовки истории (из generatePeople):
  "Первичный учёт в реестре махалли", "Обновление данных подворного обхода",
  "Собеседование с инспектором махалли", "Направлен на проф. обучение",
  "Участие в ярмарке вакансий", "Трудоустроен",
  "Актуальный статус: <status>", "Направлен на программу: <program>",
  "Результат: <outcome>"
```
Пулы имён/деятельности (`MALE/FEMALE/SURNAMES/PATRON/JOBS/STUDIES/BUSINESS/
OTHER`) — скопировать из `data.ts` строки 90–175 без изменений.

---

## 7. GitHub Actions CI (`.github/workflows/backend-ci.yml`, создаётся в S1)

```yaml
name: backend-ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: back
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: nexus_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/nexus_test
      JWT_SECRET: ci-secret
      PORT: 3001
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: back/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run migrate
      - run: npm run seed -- --count 500
      - run: npm test
      - name: boot server and hit /health
        run: |
          npm run start &
          npx wait-on -t 20000 http://localhost:3001/health
          curl -fsS http://localhost:3001/health | grep '"ok"'
```
Первый прогон workflow появится вместе с кодом S1 (PR S1 вносит и workflow, и то,
что он проверяет). Локально в тестах используется порт `5438` (docker-compose),
в CI — сервисный postgres на `5432`; и то и другое берётся из `DATABASE_URL`.

**Замечания по репозиторию (проверено на старте):**
- Ветка `main` **не защищена** — зелёный CI не форсируется автоматически,
  обязательного ревью нет, у исполнителя права ADMIN. Мержить самому, но строго
  после `gh pr checks --watch` (см. правило 3).
- `npm ci` в CI **требует `back/package-lock.json`** — он должен быть закоммичен
  начиная с S1 и обновляться при каждом изменении зависимостей.
- Бэкенд использует `npm` (отдельно от `bun` во фронте) — это ожидаемо, два
  лок-файла в разных каталогах не конфликтуют.
- squash-мерж и `--delete-branch` в репо разрешены; `--auto` не использовать.

---

## 8. Прогресс

Отмечай здесь по завершении каждой сессии: `[x]`, номер PR, что сделано,
отклонения от спеки.

- [x] **S1** — скаффолд, схема БД, `/health`, CI. PR: #1
  - Создан каркас `back/`: `package.json` (пины версий из §1) + закоммичен
    `package-lock.json`, `tsconfig.json` (ESM/strict/noEmit), `vitest.config.ts`
    (`fileParallelism:false`), `drizzle.config.ts`, `docker-compose.yml`
    (postgres:16-alpine, host-порт 5438), `.env.example`.
  - `src/db/schema.ts` — 3 таблицы с CHECK-ограничениями (text, не энумы).
    Миграция `drizzle/0000_pink_meteorite.sql` сгенерирована drizzle-kit; вручную
    дописаны `CREATE EXTENSION pg_trgm` и 3 индекса, которые drizzle-kit не
    выражает декларативно (partial `people_neet_review_idx`, partial
    `people_program_idx`, GIN `people_full_name_trgm_idx`).
  - `src/config.ts` (zod-парсинг env), `src/db/client.ts` (pg Pool + drizzle),
    `src/lib/errors.ts` (HttpError + единый errorHandler в форме
    `{error:{code,message}}`), `src/app.ts` (`buildApp()`), `src/index.ts`
    (`listen`), `src/routes/health.ts` (п.1: `SELECT 1` → 200 ok / 503 down).
  - `scripts/migrate.ts` (drizzle `migrate()`), `scripts/seed.ts` **v1** — upsert
    12 махаллей (данные инлайном в seed; полноценный `constants.ts` — в S2).
  - Тесты: `test/helpers.ts` (`buildApp`, `truncateAll`, `makeApp`),
    `test/health.test.ts` (2 теста: 200+форма, content-type json). Зелёные.
  - `.github/workflows/backend-ci.yml` — по §7, без paths-фильтра.
  - **Отклонения:** (1) `constants.ts` в S1 не создавал — 12 махаллей засеяны из
    инлайн-массива в `seed.ts`, чтобы не залезать в зону S2. (2) seed v1 не
    парсит `--count` (людей ещё нет); CI-шаг `npm run seed -- --count 500`
    просто игнорирует флаг и сеет 12 махаллей — это ок для S1.
  - Локальный прогон зелёный: `docker compose up -d` → `migrate` → `seed` →
    `typecheck` → `test` (2/2) → boot+curl `/health` → `{"status":"ok","db":"ok"}`.
- [x] **S2** — auth + детерминированный сидер. PR: #2
  - `src/db/constants.ts` — порт из `front/src/lib/data.ts` дословно: `MAHALLAS`,
    `MAHALLA_COORDS`, `STATUSES`, `REVIEW_STATUSES`, `PROGRAMS`, `GENDERS`,
    `OUTCOMES`, пулы `MALE/FEMALE/SURNAMES/PATRON/JOBS/STUDIES/BUSINESS/OTHER`,
    `mulberry32`, типы `Person`/`HistoryEvent`. Добавлен `MAHALLA_ID_BY_NAME`
    (id = индекс+1) — словарь имя→id для сидера/скоупа.
  - `src/plugins/auth.ts` — `@fastify/jwt` (HS256, `expiresIn:12h`), обёрнут в
    `fastify-plugin`, чтобы декоратор `authenticate` и `app.jwt` были видны в
    роут-плагинах с префиксом. Добавлена зависимость `fastify-plugin@^5`.
  - `src/lib/scope.ts` (`resolveScope(req)` → `{role, mahallaName, mahallaId}`),
    `src/routes/auth.ts` (пп.2–3: login с zod-валидацией, /me),
    `src/routes/meta.ts` (пп.4–5). Роуты навешены под `/api` в `app.ts`; auth
    прокинут `preHandler:[app.authenticate]` (login публичный).
  - `scripts/seed.ts` **v2** — порт `generatePeople()` дословно (seed
    `mulberry32(20260814)`). Флаги `--count` (деф.250), `--anchor YYYY-MM-DD`
    (деф. сегодня; заменяет `Date.now()` для воспроизводимости), `--append`
    (иначе `TRUNCATE people, history_events`), `--lightHistory` (≤2 события/чел).
    Вставка батчами по 1000 (people → history) в транзакции на батч; махалли
    апсертятся перед сидом.
  - Тесты: `test/auth.test.ts` (11 — оба логина, плохая махалля/роль→400,
    невалидная роль→400, round-trip `/me`, нет токена→401, `meta/mahallas`
    порядок+401, форма `dictionaries`), `test/seed.test.ts` (4 — `seed --count 50`
    подпроцессом → ровно 50 people, есть history, статусы валидны, 12 махаллей).
    Хелперы: `seedMahallas`, `tokenFor`. Итого 17/17 зелёные.
  - **Отклонения:** (1) `--lightHistory` опускает часть history-записей, но
    **не меняет поток `rnd()`** (лишние вызовы сохранены вхолостую) — поля людей
    идентичны в обоих режимах. (2) Добавлена не указанная явно зависимость
    `fastify-plugin` — без неё декораторы JWT инкапсулируются и не видны роутам.
  - Локальный прогон зелёный: `typecheck` → `migrate` → `seed --count 250/5000` →
    `test` (17/17) → boot + smoke (login/me/meta/dictionaries, 401/400).
- [x] **S3** — реестр (`GET /api/people`, `/:id`). PR: — (готово, ждёт мержа)
  - `src/lib/serialize.ts` — `toPersonListItem()`, `toPerson()` с JOIN на махаллю.
  - `src/routes/people.ts` (пп.6–7) — список с фильтрами, поиском, пагинацией,
    сортировкой (русская коллация); полный профиль с историей.
  - Динамический WHERE через drizzle `and(...conds)`; два запроса (SELECT +
    COUNT); whitelist-мапа сортировок (никогда не интерполировать); скоуп
    (mahalla-роль видит только свою махаллю, district видит всех или фильтрует).
  - Тесты: `test/people.test.ts` + `seedFixture()` в helpers (25 тестов — каждый
    фильтр, комбинации, пагинация, сортировка, поиск, скоуп, история, 404/403).
    Все 42 теста (auth + health + people + seed) зелёные.
  - Отклонений нет; контракт из `backend.md` §3 пп.6–7 реализован дословно.
- [ ] **S4** — мутации (пп.8–11). PR: —
- [ ] **S5** — агрегаты (`/api/stats/*`). PR: —
- [ ] **S6** — демо больших данных + полировка. PR: —
