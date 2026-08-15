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

export type PriorityReason =
  | { kind: "inColumn"; status: ReviewStatus; days: number }
  | { kind: "stale120"; days: number }
  | { kind: "stale60"; days: number }
  | { kind: "temirDaftar" }
  | { kind: "yoshlarAyollar" }
  | { kind: "breadwinner" }
  | { kind: "secondaryNoExp" }
  | { kind: "noSkills" };

export function computePriorityReasons(p: Person): PriorityReason[] {
  const reasons: PriorityReason[] = [];
  const colDays = daysInReviewColumn(p);
  const ageDays = dataAgeDays(p);

  if (colDays > 30) {
    reasons.push({ kind: "inColumn", status: p.neetReviewStatus, days: colDays });
  }
  if (ageDays > 120) {
    reasons.push({ kind: "stale120", days: ageDays });
  } else if (ageDays >= 60) {
    reasons.push({ kind: "stale60", days: ageDays });
  }
  if (p.familyInTemirDaftar) reasons.push({ kind: "temirDaftar" });
  if (p.inYoshlarDaftari || p.inAyollarDaftari) {
    reasons.push({ kind: "yoshlarAyollar" });
  }
  if (p.isBreadwinner) reasons.push({ kind: "breadwinner" });
  if (p.workExperienceMonths === 0 && p.educationLevel === "Среднее") {
    reasons.push({ kind: "secondaryNoExp" });
  }
  if (p.skills.length === 0) reasons.push({ kind: "noSkills" });

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
