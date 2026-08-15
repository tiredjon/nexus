// Порт из front/src/lib/data.ts — байт-в-байт. Русские доменные строки, пулы
// имён/деятельности и mulberry32 не переводить и не «исправлять»: сидер должен
// давать те же данные, что и клиентский генератор фронта.

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

// id махалли = позиция в MAHALLAS + 1 (backend.md §2).
export const MAHALLA_ID_BY_NAME: Record<Mahalla, number> = Object.fromEntries(
  MAHALLAS.map((name, i) => [name, i + 1]),
) as Record<Mahalla, number>;

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

export const GENDERS = ["Мужской", "Женский"] as const;
export const OUTCOMES = ["Трудоустроен", "Учится", "В процессе"] as const;

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

// Пулы имён/деятельности — data.ts, строки 90–175, без изменений.
export const MALE = [
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
export const FEMALE = [
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
export const SURNAMES = [
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
export const PATRON = ["угли", "кизи"];

export const JOBS = [
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
export const STUDIES = [
  "ТУИТ, 3 курс",
  "ТашГЭУ, 2 курс",
  "Колледж связи",
  "Медицинский колледж",
  "ТГТУ, 4 курс",
  "Педагогический институт",
];
export const BUSINESS = [
  "Швейный цех",
  "Точка общепита",
  "Онлайн-магазин",
  "Барбершоп",
  "Кондитерская",
  "Ремонт техники",
];
export const OTHER = [
  "Уход за ребёнком",
  "Помощь в семейном хозяйстве",
  "Военная служба",
  "Временные подработки",
];

export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
