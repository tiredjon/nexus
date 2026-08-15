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

export const EDIT_UPDATE_SOURCES = [
  "Подворный обход",
  "Самообращение",
  "Телефонный звонок",
  "Уточнение данных",
] as const satisfies readonly UpdateSource[];

export const CREATE_UPDATE_SOURCES = [
  "Подворный обход",
  "Самообращение",
  "Обращение махаллинского комитета",
] as const satisfies readonly UpdateSource[];

export const MARITAL_STATUSES = ["Не женат/не замужем", "Женат/замужем"] as const;

export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

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
const INSTITUTIONS = [
  "ТУИТ",
  "ТашГЭУ",
  "ТГТУ",
  "Колледж связи",
  "Медицинский колледж",
  "Педагогический институт",
  "Ташкентский государственный экономический университет",
  "Национальный университет Узбекистана",
];
const SPECIALTIES = [
  "Бухгалтерский учёт",
  "Сварочное дело",
  "Информационные системы",
  "Экономика",
  "Педагогика",
  "Медицинское дело",
  "Логистика",
  "Строительство",
];
const EMPLOYERS = [
  "Uzum Market",
  "Beeline Uzbekistan",
  "HUMO",
  "Artel Electronics",
  "Kapitalbank",
  "O'zbekiston temir yo'llari",
  "Toshkent shahar hokimiyati",
  "Mediapark",
];
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

export function shortName(p: Pick<Person, "lastName" | "firstName" | "patronymic">) {
  return `${p.lastName} ${p.firstName.charAt(0)}. ${p.patronymic.charAt(0)}.`;
}

export function formatWorkExperience(months: number) {
  if (months <= 0) return "нет";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const yearWord =
    years === 1 ? "1 год" : years >= 2 && years <= 4 ? `${years} года` : years > 0 ? `${years} лет` : "";
  if (years === 0) return `${rem} мес.`;
  if (rem === 0) return yearWord;
  return `${yearWord} ${rem} мес.`;
}

export function displayMaritalStatus(p: Pick<Person, "gender" | "maritalStatus">) {
  if (p.maritalStatus === "Женат/замужем") {
    return p.gender === "Мужской" ? "Женат" : "Замужем";
  }
  return p.gender === "Мужской" ? "Не женат" : "Не замужем";
}

export function buildFullName(
  gender: Person["gender"],
  lastName: string,
  firstName: string,
  patronymic: string,
) {
  return gender === "Мужской"
    ? `${lastName} ${firstName} ${patronymic} угли`
    : `${lastName} ${firstName} ${patronymic} кизи`;
}

function pickEducationLevel(age: number, rnd: () => number): EducationLevel {
  if (age <= 19) {
    if (rnd() < 0.35) return "Среднее";
    if (rnd() < 0.65) return "Колледж";
    return "Бакалавр";
  }
  if (age <= 22) {
    if (rnd() < 0.25) return "Среднее специальное";
    if (rnd() < 0.7) return "Бакалавр";
    return "Колледж";
  }
  if (age <= 25) {
    if (rnd() < 0.15) return "Среднее специальное";
    if (rnd() < 0.75) return "Бакалавр";
    return age >= 24 ? "Магистр" : "Бакалавр";
  }
  if (rnd() < 0.2) return "Среднее специальное";
  if (rnd() < 0.65) return "Бакалавр";
  return age >= 26 ? "Магистр" : "Бакалавр";
}

function pickSkills(rnd: () => number, pick: <T>(arr: readonly T[]) => T, count: number) {
  const pool = [...SKILL_POOL].sort(() => rnd() - 0.5);
  return pool.slice(0, count);
}

function pickLanguages(rnd: () => number) {
  const langs = ["узбекский", "русский"];
  if (rnd() > 0.45) langs.push("английский");
  return langs;
}

function officerName(pick: <T>(arr: readonly T[]) => T) {
  const ln = pick(SURNAMES);
  const fn = pick(MALE);
  const pat = pick(MALE);
  return `${ln} ${fn} ${pat} угли`;
}

export function generatePeople(count = 250): Person[] {
  const rnd = mulberry32(20260814);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const gender: Person["gender"] = rnd() > 0.5 ? "Мужской" : "Женский";
    const surnameBase = pick(SURNAMES);
    const lastName = gender === "Женский" ? `${surnameBase}а` : surnameBase;
    const firstName = gender === "Мужской" ? pick(MALE) : pick(FEMALE);
    const patronymic = pick(MALE);
    const fullName = buildFullName(gender, lastName, firstName, patronymic);
    const age = 18 + Math.floor(rnd() * 13);
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = 1 + Math.floor(rnd() * 12);
    const birthDay = 1 + Math.floor(rnd() * 28);
    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
    const mahalla = pick(MAHALLAS);
    const streetBlock =
      rnd() > 0.5 ? `квартал ${1 + Math.floor(rnd() * 8)}` : `массив ${1 + Math.floor(rnd() * 5)}`;
    const educationLevel = pickEducationLevel(age, rnd);

    const r = rnd();
    let status: EmploymentStatus;
    if (r < 0.42) status = "Работает";
    else if (r < 0.62) status = "Учится";
    else if (r < 0.78) status = "Безработный";
    else if (r < 0.86) status = "Предприниматель";
    else if (r < 0.93) status = "Другая деятельность";
    else status = "Статус не уточнён";

    let educationInstitution: string | null = null;
    let graduationYear: number | null = null;
    let specialty: string | null = null;

    if (status === "Учится") {
      educationInstitution = pick(INSTITUTIONS);
      specialty = pick(SPECIALTIES);
      graduationYear = null;
    } else if (educationLevel !== "Среднее") {
      specialty = rnd() > 0.25 ? pick(SPECIALTIES) : null;
      educationInstitution = rnd() > 0.35 ? pick(INSTITUTIONS) : null;
      const minGrad = birthYear + (educationLevel === "Магистр" ? 24 : educationLevel === "Бакалавр" ? 22 : 19);
      graduationYear =
        minGrad <= birthYear + age
          ? minGrad + Math.floor(rnd() * Math.max(1, age - (minGrad - birthYear)))
          : null;
      if (graduationYear && graduationYear > birthYear + age) {
        graduationYear = birthYear + age - 1;
      }
    }

    let employer: string | null = null;
    let isFormalEmployment = false;
    let workExperienceMonths = 0;

    if (status === "Работает") {
      isFormalEmployment = rnd() > 0.25;
      employer = isFormalEmployment ? pick(EMPLOYERS) : "не указано";
      workExperienceMonths = 6 + Math.floor(rnd() * Math.min(Math.max(age - 17, 1) * 10, 96));
    } else if (status === "Предприниматель") {
      isFormalEmployment = rnd() > 0.55;
      employer = isFormalEmployment ? pick(BUSINESS) : "не указано";
      workExperienceMonths = 3 + Math.floor(rnd() * Math.min(Math.max(age - 17, 1) * 8, 72));
    } else if (status === "Другая деятельность" && rnd() > 0.5) {
      workExperienceMonths = Math.floor(rnd() * 24);
    }

    const skillCount = status === "Безработный" ? Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 3);
    const skills = pickSkills(rnd, pick, skillCount);
    const hasDriverLicense = skills.includes("водительские права B") || rnd() > 0.65;
    const languages = pickLanguages(rnd);

    let desiredDirection: DesiredDirection = "Не определился";
    if (status === "Безработный" || status === "Статус не уточнён") {
      desiredDirection =
        rnd() < 0.35
          ? "Трудоустройство"
          : rnd() < 0.55
            ? "Профессиональное обучение"
            : rnd() < 0.7
              ? "Не определился"
              : rnd() < 0.85
                ? "Возвращение к обучению"
                : "Предпринимательство";
    } else if (status === "Предприниматель") {
      desiredDirection = "Предпринимательство";
    } else if (status === "Учится") {
      desiredDirection = rnd() > 0.7 ? "Трудоустройство" : "Не определился";
    } else {
      desiredDirection = rnd() > 0.6 ? "Трудоустройство" : "Не определился";
    }

    let activity = "—";
    if (status === "Работает") activity = pick(JOBS);
    else if (status === "Учится")
      activity = educationInstitution
        ? `${educationInstitution}${specialty ? ` · ${specialty}` : ""}`
        : pick(STUDIES);
    else if (status === "Предприниматель") activity = pick(BUSINESS);
    else if (status === "Другая деятельность") activity = pick(OTHER);
    else if (status === "Безработный") activity = "Ищет работу";
    else activity = "Данные не подтверждены";

    const neet =
      status === "Безработный" || (status === "Статус не уточнён" && rnd() > 0.35);

    const updDays = rnd() > 0.75 ? 95 + Math.floor(rnd() * 200) : Math.floor(rnd() * 85);
    const lastUpdate = isoMinusDays(updDays);
    const lastUpdateSource = pick(UPDATE_SOURCES);

    const householdSize = 2 + Math.floor(rnd() * 8);
    const maritalStatus: MaritalStatus =
      age >= 22 && rnd() > 0.45 ? "Женат/замужем" : "Не женат/не замужем";
    const hasChildren = age >= 22 && maritalStatus === "Женат/замужем" && rnd() > 0.4;
    const isBreadwinner = rnd() > 0.72;
    const inYoshlarDaftari = rnd() > 0.38;
    const inAyollarDaftari = gender === "Женский" && rnd() > 0.68;
    const familyInTemirDaftar = rnd() > 0.82;

    const hasProfession = skills.length > 0 || specialty != null;
    const businessInterest = desiredDirection === "Предпринимательство";
    const droppedStudies = graduationYear === null && status !== "Учится" && educationLevel !== "Среднее";

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
      lastName,
      firstName,
      patronymic,
      fullName,
      age,
      birthDate,
      gender,
      mahalla,
      streetBlock,
      educationLevel,
      educationInstitution,
      graduationYear,
      specialty,
      status,
      activity,
      employer,
      isFormalEmployment,
      workExperienceMonths,
      skills,
      desiredDirection,
      hasDriverLicense,
      languages,
      inYoshlarDaftari,
      inAyollarDaftari,
      familyInTemirDaftar,
      householdSize,
      maritalStatus,
      hasChildren,
      isBreadwinner,
      lastUpdate,
      lastUpdateSource,
      responsibleOfficer: officerName(pick),
      needsSupport: neet ? rnd() > 0.25 : rnd() > 0.85,
      neet,
      neetReviewStatus,
      hasProfession,
      businessInterest,
      droppedStudies,
      history,
      program: null,
      programOutcome: null,
      programRoutedAt: null,
      routedBy: null,
      outcome: null,
    });
  }

  const pickOutcome = (): ProgramOutcome => {
    const r = rnd();
    if (r < 0.22) return "Ожидает";
    if (r < 0.48) return "Приступил";
    if (r < 0.62) return "Завершил";
    if (r < 0.82) return "Трудоустроен";
    if (r < 0.92) return "Не явился";
    return "Отказался";
  };

  const routeCandidates = people
    .filter((p) => p.neet || p.status === "Безработный" || p.status === "Статус не уточнён")
    .sort(() => rnd() - 0.5)
    .slice(0, 40);

  for (const p of routeCandidates) {
    const program = pick(PROGRAMS);
    const routedAt = isoMinusDays(10 + Math.floor(rnd() * 90));
    const outcome = pickOutcome();

    p.program = program;
    p.programRoutedAt = routedAt;
    p.routedBy = `Представитель по молодёжи · ${p.mahalla}`;
    p.programOutcome = outcome;
    p.status = "Направлен на программу";
    p.neetReviewStatus = "Подтверждено";

    p.history.push({
      date: routedAt,
      title: `Направлен на программу: ${program}`,
      source: "программа",
    });

    if (outcome === "Трудоустроен") {
      p.status = "Работает";
      p.outcome = "Трудоустроен";
      p.isFormalEmployment = rnd() > 0.3;
      p.employer = p.isFormalEmployment ? pick(EMPLOYERS) : "не указано";
      p.workExperienceMonths = Math.max(p.workExperienceMonths, 6 + Math.floor(rnd() * 24));
      p.lastUpdate = isoMinusDays(Math.floor(rnd() * 14));
      p.history.push({
        date: p.lastUpdate,
        title: `Исход участия: ${outcome}`,
        source: "программа",
      });
    } else if (outcome === "Завершил") {
      p.outcome = "В процессе";
      p.history.push({
        date: isoMinusDays(Math.floor(rnd() * 10)),
        title: `Исход участия: ${outcome}`,
        source: "программа",
      });
    } else if (outcome === "Приступил") {
      p.outcome = "В процессе";
      p.history.push({
        date: isoMinusDays(Math.floor(rnd() * 20)),
        title: `Исход участия: ${outcome}`,
        source: "программа",
      });
    } else {
      p.outcome = "В процессе";
      if (outcome !== "Ожидает") {
        p.history.push({
          date: isoMinusDays(Math.floor(rnd() * 15)),
          title: `Исход участия: ${outcome}`,
          source: "программа",
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
