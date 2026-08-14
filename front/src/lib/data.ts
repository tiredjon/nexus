export const MAHALLAS = [
  "Дархан",
  "Буюк Ипак Йули",
  "Олтинтепа",
  "Элобод",
  "Гулзор",
  "Мингбулок",
  "Юзработ",
  "Козиробод",
  "Мустакиллик",
  "Бахор",
  "Салар",
  "Шахрисабз",
] as const;

export type Mahalla = (typeof MAHALLAS)[number];

export const MAHALLA_COORDS: Record<Mahalla, [number, number]> = {
  Дархан: [41.3455, 69.3105],
  "Буюк Ипак Йули": [41.3282, 69.3208],
  Олтинтепа: [41.3521, 69.3402],
  Элобод: [41.3388, 69.3555],
  Гулзор: [41.3215, 69.3465],
  Мингбулок: [41.3608, 69.3255],
  Юзработ: [41.3172, 69.3302],
  Козиробод: [41.3345, 69.3712],
  Мустакиллик: [41.3492, 69.3628],
  Бахор: [41.3105, 69.3585],
  Салар: [41.3268, 69.3021],
  Шахрисабз: [41.3572, 69.3495],
};

export const STATUSES = [
  "Работает",
  "Безработный",
  "Учится",
  "Предприниматель",
  "Другая деятельность",
  "Статус не уточнён",
  "Направлен на программу",
] as const;

export type EmploymentStatus = (typeof STATUSES)[number];

export const REVIEW_STATUSES = [
  "Ожидает проверки",
  "На уточнении",
  "Подтверждено",
  "Флаг снят",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const PROGRAMS = [
  "Профессиональное обучение",
  "Содействие в трудоустройстве",
  "Программа поддержки бизнеса",
  "Возвращение к обучению",
  "Молодёжная стажировка",
] as const;

export type Program = (typeof PROGRAMS)[number];

export type HistoryEvent = {
  date: string;
  title: string;
  note?: string | undefined;
};

export type Person = {
  id: string;
  fullName: string;
  age: number;
  gender: "Мужской" | "Женский";
  mahalla: Mahalla;
  status: EmploymentStatus;
  activity: string;
  lastUpdate: string;
  needsSupport: boolean;
  neet: boolean;
  neetReviewStatus: ReviewStatus;
  hasProfession: boolean;
  businessInterest: boolean;
  droppedStudies: boolean;
  history: HistoryEvent[];
  program: Program | null;
  outcome: "Трудоустроен" | "Учится" | "В процессе" | null;
};

const MALE = [
  "Азиз",
  "Жасур",
  "Бекзод",
  "Отабек",
  "Шохрух",
  "Улугбек",
  "Санжар",
  "Дилшод",
  "Фаррух",
  "Тимур",
  "Рустам",
  "Хусан",
  "Икром",
  "Достон",
  "Мирзо",
];
const FEMALE = [
  "Нилуфар",
  "Мадина",
  "Зилола",
  "Дилноза",
  "Гулнора",
  "Севара",
  "Шахноза",
  "Малика",
  "Барно",
  "Умида",
  "Феруза",
  "Камола",
  "Ситора",
  "Наргиза",
];
const SURNAMES = [
  "Каримов",
  "Юсупов",
  "Рахимов",
  "Абдуллаев",
  "Тошматов",
  "Нортожиев",
  "Эргашев",
  "Мирзаев",
  "Хамидов",
  "Салимов",
  "Азизов",
  "Умаров",
  "Исмоилов",
  "Кодиров",
  "Файзиев",
];
const PATRON = ["угли", "кизи"];

const JOBS = [
  "Оператор call-центра",
  "Продавец-консультант",
  "Водитель",
  "Швея",
  "Программист",
  "Строитель",
  "Бухгалтер",
  "Учитель начальных классов",
  "Мастер по ремонту",
  "Логист",
];
const STUDIES = [
  "ТУИТ, 3 курс",
  "ТашГЭУ, 2 курс",
  "Колледж связи",
  "Медицинский колледж",
  "ТГТУ, 4 курс",
  "Педагогический институт",
];
const BUSINESS = [
  "Швейный цех",
  "Точка общепита",
  "Онлайн-магазин",
  "Барбершоп",
  "Кондитерская",
  "Ремонт техники",
];
const OTHER = [
  "Уход за ребёнком",
  "Помощь в семейном хозяйстве",
  "Военная служба",
  "Временные подработки",
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function daysAgo(dateIso: string) {
  return Math.floor((Date.now() - new Date(dateIso).getTime()) / 86400000);
}

export function isStale(p: Person) {
  return daysAgo(p.lastUpdate) > 90;
}

function isoMinusDays(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function generatePeople(count = 250): Person[] {
  const rnd = mulberry32(20260814);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const gender = rnd() > 0.5 ? "Мужской" : "Женский";
    const first = gender === "Мужской" ? pick(MALE) : pick(FEMALE);
    const fullName = `${pick(SURNAMES)}${gender === "Женский" ? "а" : ""} ${first} ${gender === "Мужской" ? PATRON[0] : PATRON[1]}`;
    const age = 18 + Math.floor(rnd() * 13);
    const mahalla = pick(MAHALLAS);

    const r = rnd();
    let status: EmploymentStatus;
    if (r < 0.42) status = "Работает";
    else if (r < 0.62) status = "Учится";
    else if (r < 0.78) status = "Безработный";
    else if (r < 0.86) status = "Предприниматель";
    else if (r < 0.93) status = "Другая деятельность";
    else status = "Статус не уточнён";

    let activity = "—";
    if (status === "Работает") activity = pick(JOBS);
    else if (status === "Учится") activity = pick(STUDIES);
    else if (status === "Предприниматель") activity = pick(BUSINESS);
    else if (status === "Другая деятельность") activity = pick(OTHER);
    else if (status === "Безработный") activity = "Ищет работу";
    else activity = "Данные не подтверждены";

    const neet =
      status === "Безработный" || (status === "Статус не уточнён" && rnd() > 0.35);

    const updDays = rnd() > 0.75 ? 95 + Math.floor(rnd() * 200) : Math.floor(rnd() * 85);
    const lastUpdate = isoMinusDays(updDays);

    const history: HistoryEvent[] = [];
    const evCount = 2 + Math.floor(rnd() * 4);
    let base = 400;
    const seeds = [
      "Первичный учёт в реестре махалли",
      "Обновление данных подворного обхода",
      "Собеседование с инспектором махалли",
      "Направлен на проф. обучение",
      "Участие в ярмарке вакансий",
      "Трудоустроен",
    ];
    for (let e = 0; e < evCount; e++) {
      base -= 20 + Math.floor(rnd() * 90);
      history.push({ date: isoMinusDays(Math.max(base, updDays)), title: seeds[e % seeds.length]! });
    }
    history.sort((a, b) => a.date.localeCompare(b.date));
    history.push({ date: lastUpdate, title: `Актуальный статус: ${status}` });

    const rs = rnd();
    const neetReviewStatus: ReviewStatus = !neet
      ? "Флаг снят"
      : rs < 0.5
        ? "Ожидает проверки"
        : rs < 0.72
          ? "На уточнении"
          : rs < 0.9
            ? "Подтверждено"
            : "Флаг снят";

    people.push({
      id: `Y-${1000 + i}`,
      fullName,
      age,
      gender,
      mahalla,
      status,
      activity,
      lastUpdate,
      needsSupport: neet ? rnd() > 0.25 : rnd() > 0.85,
      neet,
      neetReviewStatus,
      hasProfession: rnd() > 0.5,
      businessInterest: rnd() > 0.75,
      droppedStudies: rnd() > 0.8,
      history,
      program: null,
      outcome: null,
    });
  }

  // немного уже направленных для аналитики
  for (const p of people) {
    if (p.neet && p.neetReviewStatus === "Подтверждено" && rnd() > 0.4) {
      p.program = pick(PROGRAMS);
      p.status = "Направлен на программу";
      p.outcome = rnd() > 0.55 ? (rnd() > 0.6 ? "Трудоустроен" : "Учится") : "В процессе";
      p.history.push({
        date: isoMinusDays(10 + Math.floor(rnd() * 60)),
        title: `Направлен на программу: ${p.program}`,
      });
      if (p.outcome !== "В процессе") {
        p.history.push({
          date: isoMinusDays(5 + Math.floor(rnd() * 20)),
          title: `Результат: ${p.outcome}`,
        });
      }
    }
  }

  return people;
}

export function neetMonthlyTrend(people: Person[]) {
  const months = ["Март", "Апрель", "Май", "Июнь", "Июль", "Август"];
  const total = people.filter((p) => p.neet).length;
  return months.map((m, i) => ({
    month: m,
    neet: Math.round(total * (1.22 - i * 0.04) + ((i * 7) % 5)),
  }));
}
