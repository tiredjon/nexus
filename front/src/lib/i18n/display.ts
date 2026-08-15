import type {
  EmploymentStatus,
  Program,
  ProgramOutcome,
  ReviewStatus,
} from "@/lib/data";
import type { TranslationKey } from "./ru";
import type { TParams } from "./ru";

type TranslateFn = (key: TranslationKey, params?: TParams) => string;

type LabelFns = {
  status: (value: EmploymentStatus) => string;
  program: (value: Program) => string;
  outcome: (value: ProgramOutcome) => string;
  review: (value: ReviewStatus) => string;
};

const HISTORY_SEED_KEYS: Record<string, TranslationKey> = {
  "Первичный учёт в реестре махалли": "history.seed.registry",
  "Обновление данных подворного обхода": "history.seed.doorToDoor",
  "Собеседование с инспектором махалли": "history.seed.interview",
  "Направлен на проф. обучение": "history.seed.vocational",
  "Участие в ярмарке вакансий": "history.seed.jobFair",
  Трудоустроен: "history.seed.employed",
  "Статус подтверждён сотрудником": "history.statusConfirmed",
  "Запрошено уточнение данных": "history.clarificationRequested",
};

const ACTIVITY_KEYS: Record<string, TranslationKey> = {
  "Ищет работу": "activity.lookingForWork",
  "Данные не подтверждены": "activity.unconfirmed",
  "Уход за ребёнком": "activity.childcare",
  "Помощь в семейном хозяйстве": "activity.householdHelp",
  "Военная служба": "activity.military",
  "Временные подработки": "activity.tempJobs",
  "Швейный цех": "activity.sewingShop",
  "Точка общепита": "activity.foodPoint",
  "Онлайн-магазин": "activity.onlineShop",
  Барбершоп: "activity.barbershop",
  Кондитерская: "activity.confectionery",
  "Ремонт техники": "activity.techRepair",
  "ТУИТ, 3 курс": "activity.tuit3",
  "ТашГЭУ, 2 курс": "activity.tasheu2",
  "Колледж связи": "activity.telecomCollege",
  "Медицинский колледж": "activity.medCollege",
  "ТГТУ, 4 курс": "activity.tgtu4",
  "Педагогический институт": "activity.pedInstitute",
  "Оператор call-центра": "activity.job.callCenter",
  "Продавец-консультант": "activity.job.sales",
  Водитель: "activity.job.driver",
  Швея: "activity.job.seamstress",
  Программист: "activity.job.programmer",
  Строитель: "activity.job.builder",
  Бухгалтер: "activity.job.accountant",
  "Учитель начальных классов": "activity.job.teacher",
  "Мастер по ремонту": "activity.job.repairman",
  Логист: "activity.job.logistics",
};

const ROUTED_BY_ROLE_KEYS: Record<string, TranslationKey> = {
  "Уполномоченный сотрудник махалли": "role.mahalla_officer.label",
  "Представитель махалли по работе с молодёжью": "role.youth_rep.label",
  "Представитель по молодёжи": "login.role.youth_rep",
  "Уполномоченный сотрудник районного хокимията": "role.district_officer.label",
  "Уполномоченный специалист по занятости и социальной поддержке":
    "role.employment_specialist.label",
  "Администратор системы": "role.admin.label",
  Сотрудник: "history.defaultOfficer",
};

const STATUSES = new Set<string>([
  "Работает",
  "Безработный",
  "Учится",
  "Предприниматель",
  "Другая деятельность",
  "Статус не уточнён",
  "Направлен на программу",
]);

const PROGRAMS = new Set<string>([
  "Профессиональное обучение",
  "Содействие в трудоустройстве",
  "Программа поддержки бизнеса",
  "Возвращение к обучению",
  "Молодёжная стажировка",
]);

const OUTCOMES = new Set<string>([
  "Ожидает",
  "Приступил",
  "Завершил",
  "Трудоустроен",
  "Не явился",
  "Отказался",
]);

const REVIEW_STATUSES = new Set<string>([
  "Ожидает проверки",
  "На уточнении",
  "Подтверждено",
  "Флаг снят",
]);

export function translateHistoryTitle(
  title: string,
  t: TranslateFn,
  labels: LabelFns,
): string {
  if (title === "__fieldNoteUpdated__") {
    return t("history.fieldNoteUpdated");
  }

  const seed = HISTORY_SEED_KEYS[title];
  if (seed) return t(seed);

  if (title.startsWith("Актуальный статус: ")) {
    const raw = title.slice("Актуальный статус: ".length);
    if (STATUSES.has(raw)) {
      return t("history.currentStatus", { status: labels.status(raw as EmploymentStatus) });
    }
  }

  if (title.startsWith("Направлен на программу: ")) {
    const raw = title.slice("Направлен на программу: ".length);
    if (PROGRAMS.has(raw)) {
      return t("history.routedToProgram", { program: labels.program(raw as Program) });
    }
  }

  if (title.startsWith("Исход участия: ")) {
    const raw = title.slice("Исход участия: ".length);
    if (OUTCOMES.has(raw)) {
      return t("history.outcome", { outcome: labels.outcome(raw as ProgramOutcome) });
    }
  }

  if (title.startsWith("Проверка NEET: ")) {
    const raw = title.slice("Проверка NEET: ".length);
    if (REVIEW_STATUSES.has(raw)) {
      return t("history.neetReview", { status: labels.review(raw as ReviewStatus) });
    }
  }

  if (title.startsWith("Данные уточнены: ")) {
    return t("history.dataUpdated", { fields: title.slice("Данные уточнены: ".length) });
  }

  if (title.startsWith("Данные уточнены по заметке с обхода")) {
    return t("history.fieldNoteUpdated");
  }

  return title;
}

export function translateActivity(activity: string, t: TranslateFn): string {
  if (activity === "—") return activity;

  const direct = ACTIVITY_KEYS[activity];
  if (direct) return t(direct);

  const parts = activity.split(" · ");
  if (parts.length === 2) {
    const [left, right] = parts;
    const jobKey = ACTIVITY_KEYS[right!];
    if (jobKey) {
      return t("activity.employerJob", { employer: left!, job: t(jobKey) });
    }
  }

  return activity;
}

export function translateRoutedBy(value: string, t: TranslateFn): string {
  const parts = value.split(" · ");
  const rolePart = parts[0] ?? value;
  const mahalla = parts[1];
  const roleKey = ROUTED_BY_ROLE_KEYS[rolePart];
  const role = roleKey ? t(roleKey) : rolePart;
  if (mahalla) return t("history.routedByLine", { role, mahalla });
  return role;
}

export function formatLocaleDate(iso: string, locale: "ru" | "uz"): string {
  const tag = locale === "uz" ? "uz-UZ" : "ru-RU";
  return new Date(iso).toLocaleDateString(tag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
