// Порт из front/src/lib/data.ts — байт-в-байт по доменным строкам. Русские
// значения и пулы имён не переводить и не «исправлять»: сидер обязан давать те
// же данные и тот же контракт, что и актуальный фронт.

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

export const PROGRAM_OUTCOMES = [
  "Ожидает",
  "Приступил",
  "Завершил",
  "Трудоустроен",
  "Не явился",
  "Отказался",
] as const;

export type ProgramOutcome = (typeof PROGRAM_OUTCOMES)[number];

export const EDUCATION_LEVELS = [
  "Среднее",
  "Среднее специальное",
  "Колледж",
  "Бакалавр",
  "Магистр",
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const DESIRED_DIRECTIONS = [
  "Трудоустройство",
  "Профессиональное обучение",
  "Предпринимательство",
  "Возвращение к обучению",
  "Не определился",
] as const;

export type DesiredDirection = (typeof DESIRED_DIRECTIONS)[number];

export const UPDATE_SOURCES = [
  "Подворный обход",
  "Самообращение",
  "Синхронизация реестра",
  "Телефонный звонок",
  "Уточнение данных",
  "Обращение махаллинского комитета",
] as const;

export type UpdateSource = (typeof UPDATE_SOURCES)[number];

export const MARITAL_STATUSES = ["Не женат/не замужем", "Женат/замужем"] as const;

export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const GENDERS = ["Мужской", "Женский"] as const;
export const OUTCOMES = ["Трудоустроен", "Учится", "В процессе"] as const;

export type HistoryEvent = {
  date: string;
  title: string;
  note?: string | undefined;
  source?: string | undefined;
};

export type Person = {
  id: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  fullName: string;
  age: number;
  birthDate: string;
  gender: "Мужской" | "Женский";
  mahalla: Mahalla;
  streetBlock: string;
  educationLevel: EducationLevel;
  educationInstitution: string | null;
  graduationYear: number | null;
  specialty: string | null;
  status: EmploymentStatus;
  activity: string;
  employer: string | null;
  isFormalEmployment: boolean;
  workExperienceMonths: number;
  skills: string[];
  desiredDirection: DesiredDirection;
  hasDriverLicense: boolean;
  languages: string[];
  inYoshlarDaftari: boolean;
  inAyollarDaftari: boolean;
  familyInTemirDaftar: boolean;
  householdSize: number;
  maritalStatus: MaritalStatus;
  hasChildren: boolean;
  isBreadwinner: boolean;
  lastUpdate: string;
  lastUpdateSource: UpdateSource;
  responsibleOfficer: string;
  needsSupport: boolean;
  neet: boolean;
  neetReviewStatus: ReviewStatus;
  hasProfession: boolean;
  businessInterest: boolean;
  droppedStudies: boolean;
  history: HistoryEvent[];
  program: Program | null;
  programOutcome: ProgramOutcome | null;
  programRoutedAt: string | null;
  routedBy: string | null;
  outcome: "Трудоустроен" | "Учится" | "В процессе" | null;
};

// Пулы имён/деятельности — из актуального data.ts, без изменений.
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
export const SKILL_POOL = [
  "сварка",
  "водительские права B",
  "1С",
  "английский язык",
  "ремонт техники",
  "швейное дело",
  "SMM",
  "маркетинг",
  "бухгалтерия",
  "продажи",
];
export const LANGUAGE_POOL = ["узбекский", "русский", "английский"] as const;
export const INSTITUTIONS = [
  "ТУИТ",
  "ТашГЭУ",
  "ТГТУ",
  "Колледж связи",
  "Медицинский колледж",
  "Педагогический институт",
  "Ташкентский государственный экономический университет",
  "Национальный университет Узбекистана",
];
export const SPECIALTIES = [
  "Бухгалтерский учёт",
  "Сварочное дело",
  "Информационные системы",
  "Экономика",
  "Педагогика",
  "Медицинское дело",
  "Логистика",
  "Строительство",
];
export const EMPLOYERS = [
  "Uzum Market",
  "Beeline Uzbekistan",
  "HUMO",
  "Artel Electronics",
  "Kapitalbank",
  "O'zbekiston temir yo'llari",
  "Toshkent shahar hokimiyati",
  "Mediapark",
];
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
