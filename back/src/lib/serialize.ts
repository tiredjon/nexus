import type { HistoryEvent, Mahalla, Person } from "../db/constants.js";

export type PersonListItem = Omit<Person, "history">;

export type PersonRow = {
  id: string;
  fullName: string;
  age: number;
  gender: "Мужской" | "Женский";
  mahallaId: number;
  mahallaName: string;
  status: string;
  activity: string;
  lastUpdate: string;
  needsSupport: boolean;
  neet: boolean;
  neetReviewStatus: string;
  hasProfession: boolean;
  businessInterest: boolean;
  droppedStudies: boolean;
  program: string | null;
  outcome: "Трудоустроен" | "Учится" | "В процессе" | null;
};

export function toPersonListItem(row: PersonRow): PersonListItem {
  return {
    id: row.id,
    fullName: row.fullName,
    age: row.age,
    gender: row.gender,
    mahalla: row.mahallaName as Mahalla,
    status: row.status as Person["status"],
    activity: row.activity,
    lastUpdate: row.lastUpdate,
    needsSupport: row.needsSupport,
    neet: row.neet,
    neetReviewStatus: row.neetReviewStatus as Person["neetReviewStatus"],
    hasProfession: row.hasProfession,
    businessInterest: row.businessInterest,
    droppedStudies: row.droppedStudies,
    program: row.program as Person["program"],
    outcome: row.outcome,
  };
}

export function toPerson(row: PersonRow, history: HistoryEvent[]): Person {
  return {
    ...toPersonListItem(row),
    history,
  };
}
