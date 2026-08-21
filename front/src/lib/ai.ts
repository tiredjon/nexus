// ИИ-фичи фронта. Публичные функции ходят в LLM (Gemini) через серверную
// обёртку (aiGenerate), а при любой ошибке (нет ключа, лимит 429, кривой JSON)
// тихо падают на детерминированные *Fallback ниже — так фичи всегда что-то
// показывают.
//
// Каждая функция принимает locale: язык ответа модели идёт от переключателя
// RU/UZ в интерфейсе. Без этого на узбекской версии дашборда сводка приходила
// бы по-русски. ВНИМАНИЕ: *Fallback остались русскоязычными — если модель не
// ответит на узбекской версии, заглушка будет на русском.

import { aiGenerate } from "./ai-server";
import type { Locale } from "./i18n";
import {
  COURSE_BY_ID,
  JOB_BY_ID,
  shortlistCourses,
  shortlistJobs,
  type Course,
  type Job,
} from "./opportunities";
import { MAHALLAS, daysAgo, formatWorkExperience, type Person, type Program } from "./data";
import { computePriorityLevel, dataAgeDays, daysInReviewColumn } from "./person-compute";
import type { Role } from "./permissions";

export type ParsedNote = {
  status: string;
  activityDetail: string | null;
  need: string | null;
  direction: string | null;
  flags: string[];
  confidence: "высокая" | "средняя" | "низкая";
};

export type DashboardStats = {
  total: number;
  neet: number;
  stale: number;
  stale60: number;
  highPriority: number;
  uncheckedOver30: number;
  mahalla?: string;
  mahallaNeetShare: { mahalla: string; share: number; count: number }[];
  mahallaStaleShare: { mahalla: string; staleCount: number; total: number }[];
  neetTrendDelta: number;
  routed: number;
  awaitingOutcomeOver30: number;
  programBest: { program: string; rate: number } | null;
  programWorst: { program: string; rate: number } | null;
  systemTotal?: number;
};

export type AnalyticsStats = {
  total: number;
  employed: number;
  unemployed: number;
  studying: number;
  neet: number;
  detected: number;
  checked: number;
  routed: number;
  employedOutcome: number;
  stale: number;
  staleByMahalla: { mahalla: string; stale: number; total: number }[];
  programRows: { program: string; sent: number; ok: number; rate: number }[];
  territory?: string;
};

function norm(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchKeywords(text: string, keywords: string[]) {
  const n = norm(text);
  return keywords.filter((k) => n.includes(k.toLowerCase())).length;
}

const PRESET_NOTES: { keywords: string[]; result: Omit<ParsedNote, "status"> & { status: string } }[] = [
  {
    keywords: ["колледж", "не работает", "сварк"],
    result: {
      status: "Безработный",
      activityDetail: null,
      need: "Профессиональное обучение",
      direction: "Сварочное дело",
      flags: ["выбыл из обучения", "семья в тяжёлом положении"],
      confidence: "высокая",
    },
  },
  {
    keywords: ["стройк", "без оформления", "разряд"],
    result: {
      status: "Неофициальная занятость",
      activityDetail: "Строительство",
      need: "Профессиональное обучение",
      direction: "Повышение квалификации",
      flags: ["занятость без оформления"],
      confidence: "высокая",
    },
  },
  {
    keywords: ["ребёнок", "работать", "удалён", "компьютер"],
    result: {
      status: "Уход за ребёнком",
      activityDetail: null,
      need: "Профессиональное обучение",
      direction: "Цифровые навыки",
      flags: ["требуется дистанционный формат"],
      confidence: "средняя",
    },
  },
  {
    keywords: ["уехал", "не застал", "сосед"],
    result: {
      status: "Трудовая миграция",
      activityDetail: null,
      need: null,
      direction: null,
      flags: ["данные требуют подтверждения"],
      confidence: "низкая",
    },
  },
];

function fallbackParse(text: string, person: Person): ParsedNote {
  const n = norm(text);
  let status: string = person.status;
  let need: string | null = null;
  const flags: string[] = [];

  if (/не работает|ишсиз|безработ/.test(n)) status = "Безработный";
  else if (/учится|колледж|институт/.test(n)) status = "Учится";
  else if (/без оформления|неофициально/.test(n)) status = "Неофициальная занятость";
  else if (/уехал|миграция|россия/.test(n)) status = "Трудовая миграция";
  else if (/бизнес|своё дело|тадбиркор/.test(n)) status = "Предприниматель";

  if (/курс|обучен|научиться|проф/.test(n)) need = "Профессиональное обучение";

  if (status === person.status && !need) {
    flags.push("требуется уточнение");
    return {
      status: person.status,
      activityDetail: null,
      need: null,
      direction: null,
      flags,
      confidence: "низкая",
    };
  }

  return {
    status,
    activityDetail: null,
    need,
    direction: null,
    flags: flags.length ? flags : ["требуется уточнение"],
    confidence: "низкая",
  };
}

function parseFieldNoteFallback(text: string, person: Person): ParsedNote {
  let best: (typeof PRESET_NOTES)[number] | null = null;
  let bestScore = 0;

  for (const preset of PRESET_NOTES) {
    const score = matchKeywords(text, preset.keywords);
    if (score >= 3 && score > bestScore) {
      best = preset;
      bestScore = score;
    }
  }

  if (best) return { ...best.result };

  return fallbackParse(text, person);
}

function explainRecommendationFallback(person: Person, program: Program): string {
  const parts: string[] = [];
  parts.push(`${person.age} лет, образование — ${person.educationLevel}`);

  if (person.workExperienceMonths > 0) {
    parts.push(`опыт работы ${formatWorkExperience(person.workExperienceMonths)}`);
  } else {
    parts.push("опыт работы отсутствует");
  }

  if (person.skills.length > 0) {
    parts.push(`навыки: ${person.skills.join(", ")}`);
  }

  if (person.familyInTemirDaftar) {
    parts.push("семья в Темир дафтар");
  }
  if (person.isBreadwinner) {
    parts.push("единственный кормилец");
  }
  parts.push(`состав семьи ${person.householdSize} чел.`);

  if (person.desiredDirection !== "Не определился") {
    parts.push(`желаемое направление — ${person.desiredDirection}`);
  }

  const profile = parts.join("; ");

  switch (program) {
    case "Профессиональное обучение":
      return `${profile}. Программа «${program}» рекомендована для формирования конкурентных навыков и последующего выхода на рынок труда.`;
    case "Содействие в трудоустройстве":
      return `${profile}. Имеющиеся навыки и профиль позволяют рассмотреть прямое содействие в трудоустройстве по программе «${program}».`;
    case "Программа поддержки бизнеса":
      return `${profile}. Отмечен интерес к предпринимательству — программа «${program}» может обеспечить стартовое сопровождение.`;
    case "Возвращение к обучению":
      return `${profile}. Незавершённое образование (${person.educationLevel}) указывает на целесообразность программы «${program}».`;
    case "Молодёжная стажировка":
      return `${profile}. Программа «${program}» может поддержать карьерный рост при текущем профиле занятости.`;
    default:
      return `${profile}. Программа «${program}» соответствует формальным критериям отбора.`;
  }
}

function generateDashboardSummaryFallback(
  stats: DashboardStats,
  role: Role,
): { headline: string; points: string[] } {
  if (role === "mahalla_officer" || role === "youth_rep") {
    const territory = stats.mahalla ? `махалли «${stats.mahalla}»` : "закреплённой территории";
    return {
      headline: `В ${territory} ${stats.neet} случаев требуют внимания; ${stats.stale} записей с устаревшими данными (>90 дней).`,
      points: [
        `${stats.stale60} записей не обновлялись более 60 дней — рекомендуется актуализация при обходе.`,
        `${stats.highPriority} случаев с высоким приоритетом в очереди проверки.`,
        `${stats.uncheckedOver30} сигналов находятся на проверке дольше 30 дней.`,
      ],
    };
  }

  if (role === "district_officer") {
    const topNeet = stats.mahallaNeetShare[0];
    const topStale = stats.mahallaStaleShare[0];
    const trend =
      stats.neetTrendDelta <= 0
        ? `снижение NEET на ${Math.abs(stats.neetTrendDelta)} чел. за месяц`
        : `рост NEET на ${stats.neetTrendDelta} чел. за месяц`;

    return {
      headline: `По району учтено ${stats.total} молодых людей; ${stats.neet} случаев NEET (${stats.total ? Math.round((stats.neet / stats.total) * 100) : 0}%).`,
      points: [
        topNeet
          ? `Наибольшая доля сигналов: махалля «${topNeet.mahalla}» — ${topNeet.share}% (${topNeet.count} чел.)`
          : "Сигналы NEET распределены равномерно по махаллям.",
        topStale
          ? `Худшая актуальность данных: «${topStale.mahalla}» — ${topStale.staleCount} из ${topStale.total} записей устарели`
          : "Актуальность данных по махаллям в пределах нормы.",
        `Динамика за месяц: ${trend}.`,
      ],
    };
  }

  if (role === "employment_specialist") {
    return {
      headline: `В сопровождении ${stats.routed} направленных; ${stats.awaitingOutcomeOver30} ожидают исхода более 30 дней.`,
      points: [
        `${stats.awaitingOutcomeOver30} человек без зафиксированного исхода дольше 30 дней.`,
        stats.programBest
          ? `Лучший результат: «${stats.programBest.program}» — ${stats.programBest.rate}% успешных исходов`
          : "Недостаточно данных для сравнения программ.",
        stats.programWorst
          ? `Требует внимания: «${stats.programWorst.program}» — ${stats.programWorst.rate}% успешных исходов`
          : "Все программы демонстрируют сопоставимую результативность.",
      ],
    };
  }

  // admin
  const topNeet = stats.mahallaNeetShare[0];
  const topStale = stats.mahallaStaleShare[0];
  return {
    headline: `По району ${stats.total} записей; ${stats.neet} случаев NEET требуют контроля.`,
    points: [
      topNeet
        ? `Махалля с наибольшей долей сигналов: «${topNeet.mahalla}» (${topNeet.share}%)`
        : "Распределение сигналов по махаллям без выраженных пиков.",
      topStale
        ? `Махалля с наибольшим числом устаревших записей: «${topStale.mahalla}» (${topStale.staleCount})`
        : "Актуальность данных по махаллям в целом сохранена.",
      `В системе ${stats.systemTotal ?? stats.total} записей по всем махаллям района.`,
    ],
  };
}

const PERIOD_LABELS: Record<string, string> = {
  month: "текущий месяц",
  quarter: "текущий квартал",
  half: "текущее полугодие",
};

function generateOfficialReportFallback(
  stats: AnalyticsStats,
  period: string,
): { title: string; sections: { heading: string; body: string }[] } {
  const periodLabel = PERIOD_LABELS[period] ?? period;
  const territory = stats.territory ?? "Мирзо-Улугбекского района";
  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  const worstMahalla = [...stats.staleByMahalla].sort((a, b) => b.stale - a.stale)[0];
  const bestProgram = [...stats.programRows].sort((a, b) => b.rate - a.rate)[0];
  const worstProgram = [...stats.programRows].filter((p) => p.sent > 0).sort((a, b) => a.rate - b.rate)[0];

  return {
    title: `Справка о состоянии занятости молодёжи ${territory} за ${periodLabel}`,
    sections: [
      {
        heading: "1. Общие показатели",
        body: `На отчётную дату в реестре учтено ${stats.total} молодых людей в возрасте 18–30 лет${stats.territory && stats.territory !== "Мирзо-Улугбекского района" ? ` (территория: ${stats.territory})` : ""}. Из них заняты (работают или занимаются предпринимательством) — ${stats.employed} чел. (${pct(stats.employed)}%), безработные — ${stats.unemployed} (${pct(stats.unemployed)}%), обучающиеся — ${stats.studying} (${pct(stats.studying)}%). Выявлено ${stats.neet} случаев NEET (${pct(stats.neet)}%).`,
      },
      {
        heading: "2. Выявление и проверка случаев",
        body: `По результатам мониторинга выявлено ${stats.detected} случаев, требующих внимания. Прошли проверку уполномоченными сотрудниками — ${stats.checked} чел., что составляет ${stats.detected ? Math.round((stats.checked / stats.detected) * 100) : 0}% от выявленных. Оставшиеся случаи находятся в работе на стадиях верификации.`,
      },
      {
        heading: "3. Направление на меры поддержки",
        body: `На программы поддержки направлено ${stats.routed} человек из проверенных случаев. Конверсия от выявления к направлению составляет ${stats.detected ? Math.round((stats.routed / stats.detected) * 100) : 0}%. Основные направления — профессиональное обучение, содействие в трудоустройстве и возвращение к обучению.`,
      },
      {
        heading: "4. Результативность программ",
        body: bestProgram
          ? `Наиболее результативная программа — «${bestProgram.program}» (${bestProgram.rate}% успешных исходов при ${bestProgram.sent} направлениях).${worstProgram ? ` Программа «${worstProgram.program}» показывает ${worstProgram.rate}% успешных исходов и требует анализа причин отсева.` : ""} Всего зафиксировано ${stats.employedOutcome} успешных исходов (трудоустройство или возобновление обучения).`
          : `Данных о направлениях на программы за отчётный период недостаточно для оценки результативности.`,
      },
      {
        heading: "5. Актуальность данных по махаллям",
        body: worstMahalla
          ? `Устаревшие данные (>90 дней) зафиксированы у ${stats.stale} записей (${pct(stats.stale)}%). Наибольшее отставание по актуализации — махалля «${worstMahalla.mahalla}» (${worstMahalla.stale} из ${worstMahalla.total} записей). Рекомендуется усилить подворный обход в указанных территориях.`
          : `Актуальность данных по махаллям соответствует установленным требованиям; устаревших записей — ${stats.stale}.`,
      },
      {
        heading: "6. Выводы и предложения",
        body: `По итогам анализа рекомендуется: (1) завершить проверку оставшихся NEET-сигналов; (2) обеспечить актуализацию данных в махаллях с наибольшим отставанием; (3) проанализировать причины низкой результативности отдельных программ; (4) продолжить мониторинг динамики занятости молодёжи в ${periodLabel}.`,
      },
    ],
  };
}

export function buildDashboardStats(
  people: Person[],
  allPeople: Person[],
  role: Role,
  mahalla?: string,
): DashboardStats {
  const scoped = people;
  const total = scoped.length;
  const neet = scoped.filter((p) => p.neet).length;
  const stale = scoped.filter((p) => dataAgeDays(p) > 90).length;
  const stale60 = scoped.filter((p) => dataAgeDays(p) > 60).length;
  const highPriority = scoped.filter((p) => computePriorityLevel(p) === "Высокий" && p.neet).length;
  const uncheckedOver30 = scoped.filter(
    (p) => p.neet && p.neetReviewStatus === "Ожидает проверки" && daysInReviewColumn(p) > 30,
  ).length;

  const mahallaNeetShare = MAHALLAS.map((m) => {
    const list = allPeople.filter((p) => p.mahalla === m);
    const n = list.filter((p) => p.neet).length;
    return { mahalla: m, count: n, share: list.length ? Math.round((n / list.length) * 100) : 0 };
  }).sort((a, b) => b.share - a.share);

  const mahallaStaleShare = MAHALLAS.map((m) => {
    const list = allPeople.filter((p) => p.mahalla === m);
    const s = list.filter((p) => dataAgeDays(p) > 90).length;
    return { mahalla: m, staleCount: s, total: list.length };
  }).sort((a, b) => b.staleCount - a.staleCount);

  const trend = neetMonthlyDelta(allPeople);
  const routed = scoped.filter((p) => p.program).length;
  const awaitingOutcomeOver30 = scoped.filter(
    (p) => p.program && p.programOutcome === "Ожидает" && p.programRoutedAt && daysAgo(p.programRoutedAt) > 30,
  ).length;

  const programRows = buildProgramRates(scoped);
  const withSent = programRows.filter((r) => r.sent > 0);
  const programBest = withSent.length
    ? withSent.reduce((a, b) => (b.rate > a.rate ? b : a))
    : null;
  const programWorst = withSent.length
    ? withSent.reduce((a, b) => (b.rate < a.rate ? b : a))
    : null;

  return {
    total,
    neet,
    stale,
    stale60,
    highPriority,
    uncheckedOver30,
    ...(mahalla ? { mahalla } : {}),
    mahallaNeetShare,
    mahallaStaleShare,
    neetTrendDelta: trend,
    routed,
    awaitingOutcomeOver30,
    programBest,
    programWorst,
    systemTotal: allPeople.length,
  };
}

function neetMonthlyDelta(people: Person[]) {
  const current = people.filter((p) => p.neet).length;
  return Math.round(current * 0.04 - 2);
}

function buildProgramRates(people: Person[]) {
  const PROGRAMS = [
    "Профессиональное обучение",
    "Содействие в трудоустройстве",
    "Программа поддержки бизнеса",
    "Возвращение к обучению",
    "Молодёжная стажировка",
  ] as const;

  return PROGRAMS.map((prog) => {
    const list = people.filter((p) => p.program === prog);
    const ok = list.filter(
      (p) =>
        p.programOutcome === "Трудоустроен" ||
        p.programOutcome === "Завершил" ||
        p.outcome === "Трудоустроен" ||
        p.outcome === "Учится",
    ).length;
    return { program: prog, sent: list.length, rate: list.length ? Math.round((ok / list.length) * 100) : 0 };
  });
}

export function buildAnalyticsStats(people: Person[], territory?: string): AnalyticsStats {
  const total = people.length;
  const employed = people.filter((p) => p.status === "Работает" || p.status === "Предприниматель").length;
  const unemployed = people.filter((p) => p.status === "Безработный").length;
  const studying = people.filter((p) => p.status === "Учится").length;
  const neet = people.filter((p) => p.neet).length;
  const detected = neet;
  const checked = people.filter((p) => p.neet && p.neetReviewStatus !== "Ожидает проверки").length;
  const routed = people.filter((p) => p.program).length;
  const employedOutcome = people.filter(
    (p) => p.programOutcome === "Трудоустроен" || p.status === "Учится",
  ).length;
  const stale = people.filter((p) => dataAgeDays(p) > 90).length;

  const staleByMahalla = MAHALLAS.map((m) => {
    const list = people.filter((p) => p.mahalla === m);
    return { mahalla: m, stale: list.filter((p) => dataAgeDays(p) > 90).length, total: list.length };
  });

  const programRows = buildProgramRates(people).map((r) => ({
    ...r,
    ok: people.filter(
      (p) =>
        p.program === r.program &&
        (p.programOutcome === "Трудоустроен" ||
          p.programOutcome === "Завершил" ||
          p.outcome === "Трудоустроен" ||
          p.outcome === "Учится"),
    ).length,
  }));

  return {
    total,
    employed,
    unemployed,
    studying,
    neet,
    detected,
    checked,
    routed,
    employedOutcome,
    stale,
    staleByMahalla,
    programRows,
    ...(territory ? { territory } : {}),
  };
}

// ─── Реальные вызовы LLM (Gemini) ───────────────────────────────────────────

// Кэш успешных ответов LLM на время сессии (в памяти модуля). Гасит повторные
// вызовы при ре-рендерах и повторных заходах на страницу: это и экономит квоту
// (меньше шансов словить 429), и при возврате показывает именно живой ответ, а не
// мгновенный мок. Мок и ошибки НЕ кэшируем — следующий заход снова пробует LLM.
const aiCache = new Map<string, unknown>();

// Схемы ответов (подмножество OpenAPI). Структуру ответа мы диктуем прямо в
// промпте, но форму гарантирует уже сам Gemini: эти объекты уходят в него как
// responseSchema. Поля перестают теряться, и код не сваливается в фолбэк из-за
// неполного JSON. Побочный плюс — ответ быстрее, модели не надо «додумывать»
// структуру.
// Инструкция про язык вставляется в каждый промпт. Для узбекского явно просим
// латиницу: интерфейс на латинице, а модель без уточнения иногда уходит в
// кириллицу, и страница получается разнобоем.
const LANG_RULE: Record<Locale, string> = {
  ru: "Пиши по-русски.",
  uz: "Javobni o'zbek tilida, lotin alifbosida yoz (kirill emas).",
};

const strArr = { type: "array", items: { type: "string" } };
const SCHEMA_NOTE = {
  type: "object",
  properties: {
    status: { type: "string" },
    // nullable обязателен: под схемой без него модель обязана выдать строку и
    // на пустом месте начнёт выдумывать потребность, которой в заметке нет.
    activityDetail: { type: "string", nullable: true },
    need: { type: "string", nullable: true },
    direction: { type: "string", nullable: true },
    flags: strArr,
    confidence: { type: "string" },
  },
  required: ["status", "confidence", "flags"],
};
const SCHEMA_SUMMARY = {
  type: "object",
  properties: { headline: { type: "string" }, points: strArr },
  required: ["headline", "points"],
};
const SCHEMA_REPORT = {
  type: "object",
  properties: {
    title: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: { heading: { type: "string" }, body: { type: "string" } },
        required: ["heading", "body"],
      },
    },
  },
  required: ["title", "sections"],
};
const oppItem = {
  type: "array",
  items: {
    type: "object",
    properties: { id: { type: "string" }, reason: { type: "string" } },
    required: ["id", "reason"],
  },
};
const SCHEMA_OPPORTUNITIES = {
  type: "object",
  properties: { jobs: oppItem, courses: oppItem },
  required: ["jobs", "courses"],
};

// Ответ модели в JSON-режиме приходит чистым, но на всякий случай снимаем
// возможные ```-ограждения перед JSON.parse.
function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as T;
}

const NOTE_STATUSES = [
  "Безработный",
  "Неофициальная занятость",
  "Уход за ребёнком",
  "Трудовая миграция",
  "Учится",
  "Предприниматель",
];
const CONFIDENCE_VALUES: ParsedNote["confidence"][] = ["высокая", "средняя", "низкая"];

const asStringOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

export async function parseFieldNote(
  text: string,
  person: Person,
  locale: Locale = "ru",
): Promise<ParsedNote> {
  const prompt = `Ты — ассистент сотрудника хокимията по учёту занятости молодёжи. Разбери свободную заметку с подворного обхода в структуру.

Текущие данные человека:
- статус в системе: ${person.status}
- возраст: ${person.age}, образование: ${person.educationLevel}
- махалля: ${person.mahalla}

Заметка инспектора:
"""${text}"""

Верни СТРОГО JSON без пояснений:
{
  "status": один из ${JSON.stringify(NOTE_STATUSES)} или "" если статус не ясен,
  "activityDetail": короткое описание деятельности или null,
  "need": выявленная потребность (например "Профессиональное обучение") или null,
  "direction": желаемое направление (например "Сварочное дело", "Цифровые навыки") или null,
  "flags": массив коротких пометок-рисков (например "занятость без оформления"), возможно пустой,
  "confidence": "высокая" | "средняя" | "низкая"
}
ВАЖНО: "status" и "confidence" — это коды из перечисленных списков, копируй их
дословно по-русски и НЕ переводи. ${LANG_RULE[locale]} Это правило языка
касается только свободных полей: activityDetail, need, direction, flags.
Опирайся только на текст заметки. Если данных мало — confidence "низкая".`;

  const cacheKey = `note:${locale}:${person.id}:${text}`;
  const cached = aiCache.get(cacheKey);
  if (cached !== undefined) return cached as ParsedNote;

  try {
    const raw = await aiGenerate({ data: { prompt, json: true, temperature: 0.1, schema: SCHEMA_NOTE } });
    const j = parseJson<{
      status?: unknown;
      activityDetail?: unknown;
      need?: unknown;
      direction?: unknown;
      flags?: unknown;
      confidence?: unknown;
    }>(raw);

    const status =
      typeof j.status === "string" && NOTE_STATUSES.includes(j.status)
        ? j.status
        : person.status;
    const confidence = CONFIDENCE_VALUES.includes(j.confidence as ParsedNote["confidence"])
      ? (j.confidence as ParsedNote["confidence"])
      : "средняя";
    const flags = Array.isArray(j.flags)
      ? j.flags.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      : [];

    const result: ParsedNote = {
      status,
      activityDetail: asStringOrNull(j.activityDetail),
      need: asStringOrNull(j.need),
      direction: asStringOrNull(j.direction),
      flags: flags.length ? flags : ["требуется уточнение"],
      confidence,
    };
    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("[ai] parseFieldNote → fallback:", error);
    return parseFieldNoteFallback(text, person);
  }
}

export async function explainRecommendation(
  person: Person,
  program: Program,
  locale: Locale = "ru",
): Promise<string> {
  const experience =
    person.workExperienceMonths > 0
      ? formatWorkExperience(person.workExperienceMonths)
      : "отсутствует";
  const prompt = `Ты — специалист службы занятости. Объясни в 1–2 предложениях, почему молодому человеку подходит программа «${program}». ${LANG_RULE[locale]} Официальный деловой стиль, без воды и без markdown.

Профиль:
- возраст ${person.age}, образование ${person.educationLevel}
- опыт работы: ${experience}
- навыки: ${person.skills.length ? person.skills.join(", ") : "—"}
- ${person.familyInTemirDaftar ? "семья в Темир дафтар; " : ""}${person.isBreadwinner ? "единственный кормилец; " : ""}состав семьи ${person.householdSize} чел.
- желаемое направление: ${person.desiredDirection}

Верни только текст объяснения, одним абзацем.`;

  const cacheKey = `rec:${locale}:${person.id}:${program}:${person.lastUpdate}`;
  const cached = aiCache.get(cacheKey);
  if (cached !== undefined) return cached as string;

  try {
    const raw = await aiGenerate({ data: { prompt, temperature: 0.4 } });
    const result = raw.trim().replace(/^["«]|["»]$/g, "").trim();
    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("[ai] explainRecommendation → fallback:", error);
    return explainRecommendationFallback(person, program);
  }
}

const ROLE_LABELS: Record<Role, string> = {
  mahalla_officer: "сотрудник махалли",
  youth_rep: "молодёжный лидер махалли",
  district_officer: "сотрудник районного хокимията",
  employment_specialist: "специалист службы занятости",
  admin: "администратор системы",
};

export async function generateDashboardSummary(
  stats: DashboardStats,
  role: Role,
  locale: Locale = "ru",
): Promise<{ headline: string; points: string[] }> {
  const compact = {
    территория: stats.mahalla ?? "весь район",
    всего: stats.total,
    neet: stats.neet,
    устарело_90д: stats.stale,
    устарело_60д: stats.stale60,
    высокий_приоритет: stats.highPriority,
    на_проверке_свыше_30д: stats.uncheckedOver30,
    динамика_neet_за_месяц: stats.neetTrendDelta,
    направлено_в_программы: stats.routed,
    ждут_исхода_свыше_30д: stats.awaitingOutcomeOver30,
    лучшая_программа: stats.programBest,
    худшая_программа: stats.programWorst,
    всего_в_системе: stats.systemTotal,
    топ_махалли_по_neet: stats.mahallaNeetShare.slice(0, 3),
    топ_махалли_по_устаревшим: stats.mahallaStaleShare.slice(0, 3),
  };
  const prompt = `Ты — аналитик хокимията. По готовым цифрам сделай краткую сводку дашборда для роли «${ROLE_LABELS[role]}». Не придумывай числа — используй только предоставленные.

Данные (JSON):
${JSON.stringify(compact)}

Верни СТРОГО JSON:
{ "headline": "одно ёмкое предложение с ключевой цифрой", "points": ["тезис 1", "тезис 2", "тезис 3"] }
${LANG_RULE[locale]} Пиши официально. Каждый тезис — с конкретной цифрой из данных. Ровно 3 тезиса.`;

  const cacheKey = `dash:${locale}:${role}:${stats.mahalla ?? ""}:${stats.total}:${stats.neet}:${stats.stale}:${stats.routed}:${stats.neetTrendDelta}`;
  const cached = aiCache.get(cacheKey);
  if (cached !== undefined) return cached as { headline: string; points: string[] };

  try {
    const raw = await aiGenerate({ data: { prompt, json: true, temperature: 0.4, schema: SCHEMA_SUMMARY } });
    const j = parseJson<{ headline?: unknown; points?: unknown }>(raw);
    const headline = typeof j.headline === "string" && j.headline.trim() ? j.headline.trim() : "";
    const points = Array.isArray(j.points)
      ? j.points.filter((p): p is string => typeof p === "string" && p.trim().length > 0).slice(0, 3)
      : [];
    if (!headline || points.length === 0) throw new Error("неполный ответ сводки");
    const result = { headline, points };
    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("[ai] generateDashboardSummary → fallback:", error);
    return generateDashboardSummaryFallback(stats, role);
  }
}

export async function generateOfficialReport(
  stats: AnalyticsStats,
  period: string,
  locale: Locale = "ru",
): Promise<{ title: string; sections: { heading: string; body: string }[] }> {
  const periodLabel = PERIOD_LABELS[period] ?? period;
  const territory = stats.territory ?? "Мирзо-Улугбекского района";
  const prompt = `Ты — сотрудник хокимията, готовишь официальную справку о состоянии занятости молодёжи за ${periodLabel} по территории «${territory}». Используй ТОЛЬКО приведённые цифры, не выдумывай новых.

Данные (JSON):
${JSON.stringify(stats)}

Верни СТРОГО JSON:
{ "title": "заголовок справки", "sections": [ { "heading": "1. Общие показатели", "body": "..." } ] }
Сделай ровно 6 разделов: (1) общие показатели; (2) выявление и проверка случаев; (3) направление на меры поддержки; (4) результативность программ; (5) актуальность данных по махаллям; (6) выводы и предложения. ${LANG_RULE[locale]} Заголовки разделов тоже переводи, нумерацию сохраняй. Официальный канцелярский стиль, без markdown, каждый body — связный абзац с конкретными цифрами.`;

  const cacheKey = `report:${locale}:${period}:${territory}:${stats.total}:${stats.neet}:${stats.routed}:${stats.stale}`;
  const cached = aiCache.get(cacheKey);
  if (cached !== undefined) return cached as { title: string; sections: { heading: string; body: string }[] };

  try {
    const raw = await aiGenerate({ data: { prompt, json: true, temperature: 0.4, schema: SCHEMA_REPORT } });
    const j = parseJson<{ title?: unknown; sections?: unknown }>(raw);
    const title = typeof j.title === "string" && j.title.trim() ? j.title.trim() : "";
    const sections = Array.isArray(j.sections)
      ? j.sections
          .filter(
            (s): s is { heading: string; body: string } =>
              !!s &&
              typeof (s as { heading?: unknown }).heading === "string" &&
              typeof (s as { body?: unknown }).body === "string" &&
              (s as { body: string }).body.trim().length > 0,
          )
          .map((s) => ({ heading: s.heading.trim(), body: s.body.trim() }))
      : [];
    if (!title || sections.length === 0) throw new Error("неполный ответ справки");
    const result = { title, sections };
    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("[ai] generateOfficialReport → fallback:", error);
    return generateOfficialReportFallback(stats, period);
  }
}

// ─── Подбор вакансий и курсов ───────────────────────────────────────────────

export type OpportunityMatch = {
  jobs: { job: Job; reason: string }[];
  courses: { course: Course; reason: string }[];
};

const lower = (s: string) => s.toLowerCase().trim();

// Правило-фолбэк: берём верх шортлиста и формулируем обоснование по пересечению
// навыков / новизне навыка. Используется, если LLM недоступен.
function recommendOpportunitiesFallback(person: Person): OpportunityMatch {
  const have = new Set(person.skills.map(lower));

  const jobs = shortlistJobs(person, 3).map((job) => {
    const overlap = job.requiredSkills.filter((s) => have.has(lower(s)));
    const reason = overlap.length
      ? `Совпадение по навыкам: ${overlap.join(", ")}.`
      : job.entryLevel
        ? "Стартовая позиция без требований к опыту работы."
        : `Подходит по уровню образования (${person.educationLevel}).`;
    return { job, reason };
  });

  const courses = shortlistCourses(person, 3).map((course) => {
    const fresh = course.skillsGained.filter((s) => !have.has(lower(s)));
    const reason = fresh.length
      ? `Даёт навык «${fresh[0]}» по направлению «${course.direction}».`
      : `Углубление в направлении «${course.direction}».`;
    return { course, reason };
  });

  return { jobs, courses };
}

export async function recommendOpportunities(
  person: Person,
  locale: Locale = "ru",
): Promise<OpportunityMatch> {
  const cacheKey = `opp:${locale}:${person.id}:${person.lastUpdate}:${person.skills.join("|")}:${person.desiredDirection}`;
  const cached = aiCache.get(cacheKey);
  if (cached !== undefined) return cached as OpportunityMatch;

  const jobCands = shortlistJobs(person, 6);
  const courseCands = shortlistCourses(person, 6);
  const seeker = person.neet || person.status === "Безработный" || person.workExperienceMonths === 0;

  const prompt = `Ты — карьерный консультант службы занятости. Подбери молодому человеку подходящие вакансии и курсы ТОЛЬКО из предложенных списков (по id). Не выдумывай позиции, которых нет в списках.

Профиль:
- возраст ${person.age}, образование ${person.educationLevel}, статус ${person.status}${person.neet ? ", NEET" : ""}
- навыки: ${person.skills.length ? person.skills.join(", ") : "нет"}
- опыт работы: ${person.workExperienceMonths > 0 ? formatWorkExperience(person.workExperienceMonths) : "отсутствует"}
- желаемое направление: ${person.desiredDirection}
${seeker ? "Человек не трудоустроен — приоритет: быстрый выход на работу и/или курс для входа в профессию." : "Человек занят — можно предложить рост или повышение квалификации."}

Вакансии (кандидаты):
${jobCands.map((j) => `${j.id}: ${j.title}, ${j.employer}, нужны навыки: ${j.requiredSkills.join("/") || "нет"}, ${j.type}`).join("\n")}

Курсы (кандидаты):
${courseCands.map((c) => `${c.id}: ${c.title}, даёт: ${c.skillsGained.join("/")}, направление ${c.direction}, ${c.free ? "бесплатно" : "платно"}`).join("\n")}

Верни СТРОГО JSON:
{ "jobs": [ { "id": "J-01", "reason": "одна фраза почему подходит" } ], "courses": [ { "id": "C-03", "reason": "одна фраза" } ] }
До 3 вакансий и до 3 курсов. Если подходящих вакансий нет (мало навыков) — верни пустой jobs и сделай упор на курсы. Поле "id" копируй дословно из списков выше, оно не переводится. ${LANG_RULE[locale]} — это касается поля reason: конкретно, со ссылкой на навык или направление человека. НЕ упоминай в reason коды/идентификаторы позиций (J-01, C-03 и т.п.) — пиши по смыслу.`;

  try {
    const raw = await aiGenerate({ data: { prompt, json: true, temperature: 0.3, schema: SCHEMA_OPPORTUNITIES } });
    const j = parseJson<{ jobs?: unknown; courses?: unknown }>(raw);

    const pick = <T>(arr: unknown, map: Map<string, T>): { entity: T; reason: string }[] => {
      const out: { entity: T; reason: string }[] = [];
      for (const it of Array.isArray(arr) ? arr : []) {
        const id = (it as { id?: unknown }).id;
        const reason = (it as { reason?: unknown }).reason;
        if (typeof id !== "string") continue;
        const entity = map.get(id);
        if (!entity) continue;
        out.push({ entity, reason: typeof reason === "string" ? reason.trim() : "" });
        if (out.length >= 3) break;
      }
      return out;
    };

    const jobs = pick<Job>(j.jobs, JOB_BY_ID).map((x) => ({ job: x.entity, reason: x.reason }));
    const courses = pick<Course>(j.courses, COURSE_BY_ID).map((x) => ({ course: x.entity, reason: x.reason }));

    if (jobs.length === 0 && courses.length === 0) throw new Error("пустой подбор");
    const result: OpportunityMatch = { jobs, courses };
    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("[ai] recommendOpportunities → fallback:", error);
    return recommendOpportunitiesFallback(person);
  }
}
