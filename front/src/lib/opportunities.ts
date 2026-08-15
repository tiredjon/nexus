// Синтетический каталог вакансий и курсов + дешёвый клиентский скоринг под
// профиль человека. ИИ (recommendOpportunities в ./ai) выбирает финал из шортлиста
// по id — так рекомендации всегда реальны (из каталога), а не выдуманы моделью.
// Навыки согласованы со SKILL_POOL из ./data, чтобы пересечения считались.

import { MAHALLAS, type EducationLevel, type Mahalla, type Person } from "./data";

export type Job = {
  id: string;
  title: string;
  employer: string;
  mahalla: Mahalla;
  requiredSkills: string[];
  minEducation: EducationLevel;
  salary: string;
  type: "Полная занятость" | "Частичная занятость" | "Стажировка";
  // Подходит без опыта — ключевой признак для NEET и безработных.
  entryLevel: boolean;
};

export type Course = {
  id: string;
  title: string;
  provider: string;
  direction: string;
  skillsGained: string[];
  duration: string;
  format: "Онлайн" | "Очно" | "Смешанный";
  free: boolean;
};

const EDU_RANK: Record<EducationLevel, number> = {
  Среднее: 1,
  "Среднее специальное": 2,
  Колледж: 3,
  Бакалавр: 4,
  Магистр: 5,
};

// mahalla раздаём по кругу — детерминированно и без привязки к реальным адресам.
const m = (i: number): Mahalla => MAHALLAS[i % MAHALLAS.length] as Mahalla;

export const JOBS: Job[] = [
  { id: "J-01", title: "Сварщик", employer: "Artel Electronics", mahalla: m(0), requiredSkills: ["сварка"], minEducation: "Среднее специальное", salary: "5–7 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-02", title: "Помощник сварщика (стажировка)", employer: "O'zbekiston temir yo'llari", mahalla: m(1), requiredSkills: ["сварка"], minEducation: "Среднее", salary: "3–4 млн сум", type: "Стажировка", entryLevel: true },
  { id: "J-03", title: "Швея", employer: "Швейный цех «Yangi Hayot»", mahalla: m(2), requiredSkills: ["швейное дело"], minEducation: "Среднее", salary: "4–6 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-04", title: "Закройщик", employer: "Швейный цех «Yangi Hayot»", mahalla: m(3), requiredSkills: ["швейное дело"], minEducation: "Колледж", salary: "6–8 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-05", title: "Продавец-консультант", employer: "Uzum Market", mahalla: m(4), requiredSkills: ["продажи"], minEducation: "Среднее", salary: "4–6 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-06", title: "Кассир", employer: "Uzum Market", mahalla: m(5), requiredSkills: ["продажи", "1С"], minEducation: "Среднее", salary: "4–5 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-07", title: "Оператор call-центра", employer: "Beeline Uzbekistan", mahalla: m(6), requiredSkills: ["продажи"], minEducation: "Среднее", salary: "4–6 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-08", title: "Специалист технической поддержки", employer: "Beeline Uzbekistan", mahalla: m(7), requiredSkills: ["ремонт техники", "английский язык"], minEducation: "Колледж", salary: "6–9 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-09", title: "Бухгалтер", employer: "Kapitalbank", mahalla: m(8), requiredSkills: ["бухгалтерия", "1С"], minEducation: "Бакалавр", salary: "8–12 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-10", title: "Помощник бухгалтера", employer: "HUMO", mahalla: m(9), requiredSkills: ["1С", "бухгалтерия"], minEducation: "Среднее специальное", salary: "5–7 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-11", title: "Кладовщик", employer: "Uzum Market", mahalla: m(10), requiredSkills: ["1С"], minEducation: "Среднее", salary: "4–6 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-12", title: "Водитель-курьер", employer: "Uzum Market", mahalla: m(11), requiredSkills: ["водительские права B"], minEducation: "Среднее", salary: "5–8 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-13", title: "Мастер по ремонту техники", employer: "Artel Electronics", mahalla: m(0), requiredSkills: ["ремонт техники"], minEducation: "Среднее специальное", salary: "5–8 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-14", title: "SMM-специалист", employer: "Mediapark", mahalla: m(1), requiredSkills: ["SMM", "маркетинг"], minEducation: "Колледж", salary: "6–9 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-15", title: "Менеджер по продажам", employer: "Kapitalbank", mahalla: m(2), requiredSkills: ["продажи", "английский язык"], minEducation: "Колледж", salary: "7–10 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-16", title: "IT-поддержка (стажировка)", employer: "Beeline Uzbekistan", mahalla: m(3), requiredSkills: ["ремонт техники"], minEducation: "Колледж", salary: "3–5 млн сум", type: "Стажировка", entryLevel: true },
  { id: "J-17", title: "Электрик", employer: "O'zbekiston temir yo'llari", mahalla: m(4), requiredSkills: [], minEducation: "Среднее специальное", salary: "5–7 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-18", title: "Оператор станка", employer: "Artel Electronics", mahalla: m(5), requiredSkills: [], minEducation: "Среднее", salary: "4–6 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-19", title: "Администратор", employer: "Toshkent shahar hokimiyati", mahalla: m(6), requiredSkills: ["1С"], minEducation: "Колледж", salary: "5–7 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-20", title: "Менеджер маркетплейса", employer: "Uzum Market", mahalla: m(7), requiredSkills: ["маркетинг", "продажи", "1С"], minEducation: "Колледж", salary: "7–10 млн сум", type: "Полная занятость", entryLevel: false },
  { id: "J-21", title: "Строитель-отделочник", employer: "Toshkent qurilish", mahalla: m(8), requiredSkills: [], minEducation: "Среднее", salary: "5–8 млн сум", type: "Полная занятость", entryLevel: true },
  { id: "J-22", title: "Бариста / помощник повара", employer: "Кафе «Registon»", mahalla: m(9), requiredSkills: [], minEducation: "Среднее", salary: "3–5 млн сум", type: "Частичная занятость", entryLevel: true },
  { id: "J-23", title: "Переводчик-стажёр", employer: "Mediapark", mahalla: m(10), requiredSkills: ["английский язык"], minEducation: "Бакалавр", salary: "5–7 млн сум", type: "Стажировка", entryLevel: true },
  { id: "J-24", title: "Ассистент отдела маркетинга", employer: "Mediapark", mahalla: m(11), requiredSkills: ["маркетинг"], minEducation: "Среднее специальное", salary: "4–6 млн сум", type: "Частичная занятость", entryLevel: true },
];

export const COURSES: Course[] = [
  { id: "C-01", title: "Профессиональная сварка", provider: "Учебный центр «Hunarmand»", direction: "Сварка", skillsGained: ["сварка"], duration: "3 мес", format: "Очно", free: true },
  { id: "C-02", title: "Швейное мастерство", provider: "Ayollar mehnat markazi", direction: "Швейное дело", skillsGained: ["швейное дело"], duration: "2 мес", format: "Очно", free: true },
  { id: "C-03", title: "1С:Бухгалтерия с нуля", provider: "IT Park Academy", direction: "Бухгалтерия", skillsGained: ["1С", "бухгалтерия"], duration: "2 мес", format: "Смешанный", free: false },
  { id: "C-04", title: "Основы бухгалтерского учёта", provider: "Kasb-hunar markazi", direction: "Бухгалтерия", skillsGained: ["бухгалтерия"], duration: "3 мес", format: "Очно", free: true },
  { id: "C-05", title: "Веб-разработка (Frontend)", provider: "IT Park Academy", direction: "IT", skillsGained: ["веб-разработка"], duration: "6 мес", format: "Онлайн", free: true },
  { id: "C-06", title: "Основы программирования", provider: "Najot Ta'lim", direction: "IT", skillsGained: ["программирование"], duration: "4 мес", format: "Очно", free: false },
  { id: "C-07", title: "Английский язык (A1–B1)", provider: "English First", direction: "Языки", skillsGained: ["английский язык"], duration: "6 мес", format: "Смешанный", free: false },
  { id: "C-08", title: "Цифровой маркетинг и SMM", provider: "IT Park Academy", direction: "Маркетинг", skillsGained: ["SMM", "маркетинг"], duration: "3 мес", format: "Онлайн", free: true },
  { id: "C-09", title: "Продажи и работа с клиентами", provider: "Uzum Academy", direction: "Продажи", skillsGained: ["продажи"], duration: "1 мес", format: "Онлайн", free: true },
  { id: "C-10", title: "Ремонт бытовой техники", provider: "Artel Academy", direction: "Техника", skillsGained: ["ремонт техники"], duration: "3 мес", format: "Очно", free: true },
  { id: "C-11", title: "Основы предпринимательства", provider: "Агентство по делам молодёжи", direction: "Предпринимательство", skillsGained: ["бизнес-планирование"], duration: "2 мес", format: "Очно", free: true },
  { id: "C-12", title: "Водительские курсы (категория B)", provider: "Автошкола «Yo'l»", direction: "Транспорт", skillsGained: ["водительские права B"], duration: "2 мес", format: "Очно", free: false },
  { id: "C-13", title: "Data-аналитика для начинающих", provider: "IT Park Academy", direction: "IT", skillsGained: ["аналитика данных", "Excel"], duration: "4 мес", format: "Онлайн", free: true },
  { id: "C-14", title: "Мобильная разработка", provider: "Najot Ta'lim", direction: "IT", skillsGained: ["мобильная разработка"], duration: "6 мес", format: "Очно", free: false },
  { id: "C-15", title: "Графический дизайн", provider: "Mediapark School", direction: "Дизайн", skillsGained: ["графический дизайн"], duration: "4 мес", format: "Смешанный", free: false },
  { id: "C-16", title: "Английский для IT", provider: "IT Park Academy", direction: "Языки", skillsGained: ["английский язык"], duration: "3 мес", format: "Онлайн", free: true },
  { id: "C-17", title: "Курс 1С:Торговля и склад", provider: "IT Park Academy", direction: "Бухгалтерия", skillsGained: ["1С"], duration: "1 мес", format: "Онлайн", free: false },
  { id: "C-18", title: "Основы логистики", provider: "ТГТУ", direction: "Логистика", skillsGained: ["логистика"], duration: "3 мес", format: "Смешанный", free: false },
  { id: "C-19", title: "Кулинарное дело", provider: "Kasb-hunar markazi", direction: "Услуги", skillsGained: ["кулинария"], duration: "2 мес", format: "Очно", free: true },
  { id: "C-20", title: "Парикмахер-стилист", provider: "Go'zallik markazi", direction: "Услуги", skillsGained: ["парикмахерское дело"], duration: "3 мес", format: "Очно", free: false },
];

export const JOB_BY_ID = new Map(JOBS.map((j) => [j.id, j]));
export const COURSE_BY_ID = new Map(COURSES.map((c) => [c.id, c]));

function norm(s: string) {
  return s.toLowerCase().trim();
}

function isJobSeeker(p: Person): boolean {
  return p.neet || p.status === "Безработный" || p.workExperienceMonths === 0;
}

// Насколько вакансия подходит человеку (0..~12). Пересечение навыков — главный
// сигнал; для NEET/безработных поднимаем entry-level позиции.
export function scoreJob(person: Person, job: Job): number {
  let score = 0;
  const skills = new Set(person.skills.map(norm));
  const overlap = job.requiredSkills.filter((s) => skills.has(norm(s))).length;
  score += overlap * 3;

  const eduOk = EDU_RANK[person.educationLevel] >= EDU_RANK[job.minEducation];
  score += eduOk ? 2 : -3;

  if (job.entryLevel && isJobSeeker(person)) score += 2;
  if (person.desiredDirection === "Трудоустройство") score += 1;
  if (person.mahalla === job.mahalla) score += 1;
  if (person.hasDriverLicense && job.requiredSkills.includes("водительские права B")) score += 2;

  return score;
}

// Насколько курс полезен человеку (0..~10). Ценим новые навыки под желаемое
// направление и бесплатные/базовые курсы для незанятых.
export function scoreCourse(person: Person, course: Course): number {
  let score = 0;
  const skills = new Set(person.skills.map(norm));

  const newSkills = course.skillsGained.filter((s) => !skills.has(norm(s))).length;
  score += newSkills * 2;
  // Курс, дублирующий уже имеющиеся навыки, малополезен.
  if (newSkills === 0) score -= 2;

  const dir = person.desiredDirection;
  if (dir === "Профессиональное обучение" || dir === "Возвращение к обучению") score += 2;
  if (dir === "Предпринимательство" && course.direction === "Предпринимательство") score += 3;

  // Направление курса перекликается с уже имеющимся навыком/специальностью —
  // логичное углубление.
  if (person.specialty && norm(course.direction).includes(norm(person.specialty.split(" ")[0] ?? ""))) {
    score += 1;
  }

  if (isJobSeeker(person)) score += 2;
  if (course.free) score += 1;

  return score;
}

export function shortlistJobs(person: Person, n = 8): Job[] {
  return [...JOBS]
    .map((j) => ({ j, s: scoreJob(person, j) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.j);
}

export function shortlistCourses(person: Person, n = 8): Course[] {
  return [...COURSES]
    .map((c) => ({ c, s: scoreCourse(person, c) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.c);
}
