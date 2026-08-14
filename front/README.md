# Yoshlar Direction

Lovable Prompt — Youth Employment Monitoring & Routing System

Build "Yoshlar Radar" — an internal government web dashboard for monitoring youth employment and routing young people to support programs at the mahalla (neighborhood) and district level. This is a hackathon prototype for the Mirzo-Ulugbek district administration (hokimiyat) in Tashkent, Uzbekistan. The entire UI must be in Russian. All data is synthetic and generated client-side — no real personal data anywhere.

Design

Clean, modern government analytics product — think Linear / Vercel dashboard, NOT a legacy gov site. Light theme, white surfaces, slate text. Primary deep blue (#1d4ed8); emerald = employed/positive; amber = needs attention/unknown; red = NEET/critical. Inter font, generous whitespace, subtle borders, rounded-xl cards. Left sidebar navigation with icons. Responsive.

Mock auth & roles

Login page = a role picker (no real auth):

"Инспектор махалли" — user picks a mahalla from a dropdown; afterwards sees ONLY that mahalla's data on every page (filters locked).

"Сотрудник хокимията района" — sees all 12 mahallas, can filter freely.

Show current role + territory in the sidebar footer with a "Сменить роль" button.

Synthetic data (generate on load, keep in a client-side store)

~250 youth profiles, ages 18–30, distributed across 12 mahallas of Mirzo-Ulugbek district (plausible Uzbek names for mahallas: Дархан, Буюк Ипак Йули, Олтинтепа, Элобод, Гулзор, Мингбулок, Юзработ, Козиробод, Мустакиллик, Бахор, Салар, Шахрисабз).

Each profile has: synthetic Uzbek full name, age, gender, mahalla, employment status (Работает / Безработный / Учится / Предприниматель / Другая деятельность / Статус не уточнён), activity detail (job title / study place / business type), last data update date (make some >90 days old = stale), needsSupport boolean, NEET flag (computed: not working AND not studying AND no other established activity), neetReviewStatus (Ожидает проверки / На уточнении / Подтверждено / Флаг снят), status history (2–5 dated events, e.g. Безработный → Направлен на проф. обучение → Трудоустроен), assigned support program (nullable).

Pages

1. Дашборд (/) — KPI cards row: Всего молодёжи, Занятые (count + %), Безработные, NEET (требуют внимания), Статус не уточнён, Данные устарели (>90 дней). Charts: donut of status distribution, horizontal stacked bar by mahalla, line chart "Динамика NEET за 6 месяцев". Widget "Требуют внимания" — top-5 pending NEET cases with links to profiles.

2. Карта района (/map) — react-leaflet map centered on Mirzo-Ulugbek district, Tashkent (~41.335, 69.335, zoom 13). One circle marker per mahalla at plausible coordinates spread around the district: radius proportional to youth count, color by NEET share (green <5%, amber 5–12%, red >12%). Popup: mahalla name, mini-stats (всего / занятые / NEET), button "Открыть махаллю" → registry filtered by that mahalla. Banner under the map: "Отображаются только агрегированные показатели по территориям. Точные адреса граждан не используются."

3. Реестр молодёжи (/registry) — table with search by name and filters: mahalla (locked for mahalla-officer role), status, age range, "только NEET", "нужна поддержка", "устаревшие данные". Sortable columns, colored status badges, freshness dot per row (green/amber/red) with "обновлено N дней назад". Row click → profile.

4. Профиль (/person/:id) — header card: name, age, mahalla, status badge, NEET badge if flagged, last updated. Left column: vertical timeline of status history with dates and icons. Right column: "Рекомендуемые направления поддержки" — rule-based suggestion cards with a visible reason line, e.g.: безработный + нет профессии → «Профессиональное обучение»; безработный + есть навык → «Содействие в трудоустройстве»; интерес к предпринимательству → «Программа поддержки бизнеса»; не завершил обучение → «Возвращение к обучению». Each card has a "Направить" button → modal: pick program + comment → appends a dated event to history, sets status "Направлен на программу", shows toast. Also buttons: "Подтвердить статус (проверено)" and "Запросить уточнение". Small disclaimer under recommendations: "Рекомендации носят справочный характер. Решение принимает уполномоченный сотрудник."

5. Требуют внимания (/review) — NEET review queue as a kanban board with 4 columns: Ожидает проверки / На уточнении / Подтверждено / Флаг снят. Drag-and-drop between columns; each card = person mini-info + days waiting + link to profile. Top banner: "Флаг NEET — это сигнал для проверки уполномоченным сотрудником, а не окончательный административный статус."

6. Аналитика (/analytics) — funnel «Выявлен → Проверен → Направлен на программу → Трудоустроен / учится», program effectiveness table (программа, направлено, успешные исходы, %), monthly trend charts.

Behaviors

Role-based territory scoping applied on EVERY page.

Every action (route to program, confirm, request clarification, kanban move) appends a dated event to the person's history and updates dashboards reactively.

Empty states, loading states, toasts on actions.

Header shows current date and a fake "Последняя синхронизация данных: …" timestamp.

Tech

React + TypeScript + Tailwind + shadcn/ui + recharts + react-leaflet. All state client-side (context or zustand). No backend, no real auth. Everything must work with the generated demo data out of the box.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://yoshlar-radar-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b93245e-43b7-428d-a46b-cd20b77edbca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
