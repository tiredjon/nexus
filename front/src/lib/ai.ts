// TODO: заменить тела функций на вызов LLM API.
// Компоненты меняться не должны — контракт функций фиксирован.

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

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

export async function parseFieldNote(text: string, person: Person): Promise<ParsedNote> {
  await delay(1400);

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

export async function explainRecommendation(person: Person, program: Program): Promise<string> {
  await delay(900);

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

export async function generateDashboardSummary(
  stats: DashboardStats,
  role: Role,
): Promise<{ headline: string; points: string[] }> {
  await delay(1600);

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

export async function generateOfficialReport(
  stats: AnalyticsStats,
  period: string,
): Promise<{ title: string; sections: { heading: string; body: string }[] }> {
  await delay(2200);

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
