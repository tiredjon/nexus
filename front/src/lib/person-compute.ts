import { daysAgo, type Person, type ReviewStatus } from "./data";

export type PriorityLevel = "Высокий" | "Средний" | "Обычный";

export function dataAgeDays(p: Person): number {
  return daysAgo(p.lastUpdate);
}

const COLUMN_ENTRY_TITLES: Record<ReviewStatus, string[]> = {
  "Ожидает проверки": ["Проверка NEET: Ожидает проверки"],
  "На уточнении": ["Проверка NEET: На уточнении", "Запрошено уточнение данных"],
  Подтверждено: ["Проверка NEET: Подтверждено", "Статус подтверждён сотрудником"],
  "Флаг снят": ["Проверка NEET: Флаг снят"],
};

export function daysInReviewColumn(p: Person): number {
  const titles = COLUMN_ENTRY_TITLES[p.neetReviewStatus];
  let entryDate: string | null = null;

  for (let i = p.history.length - 1; i >= 0; i--) {
    const event = p.history[i]!;
    if (titles.includes(event.title)) {
      entryDate = event.date;
      break;
    }
  }

  if (!entryDate) entryDate = p.lastUpdate;
  return daysAgo(entryDate);
}

export function computePriorityScore(p: Person): number {
  let score = 0;
  if (daysInReviewColumn(p) > 30) score += 2;
  const ageDays = dataAgeDays(p);
  if (ageDays > 120) score += 2;
  else if (ageDays >= 60) score += 1;
  if (p.familyInTemirDaftar) score += 2;
  if (p.inYoshlarDaftari || p.inAyollarDaftari) score += 1;
  if (p.isBreadwinner) score += 2;
  if (p.workExperienceMonths === 0 && p.educationLevel === "Среднее") score += 1;
  if (p.skills.length === 0) score += 1;
  return score;
}

export function computePriorityLevel(p: Person): PriorityLevel {
  const score = computePriorityScore(p);
  if (score >= 6) return "Высокий";
  if (score >= 3) return "Средний";
  return "Обычный";
}

export function computePriorityReasons(p: Person): string[] {
  const reasons: string[] = [];
  const colDays = daysInReviewColumn(p);
  const ageDays = dataAgeDays(p);

  if (colDays > 30) {
    reasons.push(`В колонке «${p.neetReviewStatus}» более 30 дней (${colDays} дн.)`);
  }
  if (ageDays > 120) {
    reasons.push(`Данные не обновлялись более 120 дней (${ageDays} дн.)`);
  } else if (ageDays >= 60) {
    reasons.push(`Данные не обновлялись 60–120 дней (${ageDays} дн.)`);
  }
  if (p.familyInTemirDaftar) reasons.push("Семья в Темир дафтар");
  if (p.inYoshlarDaftari || p.inAyollarDaftari) {
    reasons.push("Состоит в реестре Ёшлар/Аёллар");
  }
  if (p.isBreadwinner) reasons.push("Единственный кормилец");
  if (p.workExperienceMonths === 0 && p.educationLevel === "Среднее") {
    reasons.push("Среднее образование без опыта работы");
  }
  if (p.skills.length === 0) reasons.push("Навыки не указаны");

  return reasons;
}

export function computeNeet(p: Pick<Person, "status">): boolean {
  return p.status === "Безработный" || p.status === "Статус не уточнён";
}

export function computeSignalReasons(p: Person): string[] {
  const reasons: string[] = [];
  if (p.status === "Безработный") reasons.push("Статус: безработный");
  if (p.status === "Статус не уточнён") reasons.push("Статус занятости не уточнён");
  if (p.workExperienceMonths === 0 && p.educationLevel === "Среднее") {
    reasons.push("Среднее образование, опыт работы отсутствует");
  }
  if (p.skills.length === 0) reasons.push("Навыки не указаны");
  if (dataAgeDays(p) > 90) reasons.push("Данные устарели");
  return reasons;
}

export function compareByPriority(a: Person, b: Person): number {
  const scoreDiff = computePriorityScore(b) - computePriorityScore(a);
  if (scoreDiff !== 0) return scoreDiff;
  return daysInReviewColumn(b) - daysInReviewColumn(a);
}
