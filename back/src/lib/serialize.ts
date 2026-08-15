import type { HistoryEvent, Mahalla, Person } from "../db/constants.js";
import type { people } from "../db/schema.js";

// PersonListItem — всё то же, что Person, но без history (backend.md §3).
export type PersonListItem = Omit<Person, "history">;

// Строка people + имя махалли из JOIN. mahallaName приходит из leftJoin, поэтому
// в типе он nullable — на деле FK гарантирует наличие.
export type PersonRow = typeof people.$inferSelect & {
  mahallaName: string | null;
};

// mahalla отдаётся именем-строкой (не id), ключи camelCase — контракт совпадает
// с типом Person во фронте.
export function toPersonListItem(row: PersonRow): PersonListItem {
  return {
    id: row.id,
    lastName: row.lastName,
    firstName: row.firstName,
    patronymic: row.patronymic,
    fullName: row.fullName,
    age: row.age,
    birthDate: row.birthDate,
    gender: row.gender as Person["gender"],
    mahalla: row.mahallaName as Mahalla,
    streetBlock: row.streetBlock,
    educationLevel: row.educationLevel as Person["educationLevel"],
    educationInstitution: row.educationInstitution,
    graduationYear: row.graduationYear,
    specialty: row.specialty,
    status: row.status as Person["status"],
    activity: row.activity,
    employer: row.employer,
    isFormalEmployment: row.isFormalEmployment,
    workExperienceMonths: row.workExperienceMonths,
    skills: row.skills,
    desiredDirection: row.desiredDirection as Person["desiredDirection"],
    hasDriverLicense: row.hasDriverLicense,
    languages: row.languages,
    inYoshlarDaftari: row.inYoshlarDaftari,
    inAyollarDaftari: row.inAyollarDaftari,
    familyInTemirDaftar: row.familyInTemirDaftar,
    householdSize: row.householdSize,
    maritalStatus: row.maritalStatus as Person["maritalStatus"],
    hasChildren: row.hasChildren,
    isBreadwinner: row.isBreadwinner,
    lastUpdate: row.lastUpdate,
    lastUpdateSource: row.lastUpdateSource as Person["lastUpdateSource"],
    responsibleOfficer: row.responsibleOfficer,
    needsSupport: row.needsSupport,
    neet: row.neet,
    neetReviewStatus: row.neetReviewStatus as Person["neetReviewStatus"],
    hasProfession: row.hasProfession,
    businessInterest: row.businessInterest,
    droppedStudies: row.droppedStudies,
    program: row.program as Person["program"],
    programOutcome: row.programOutcome as Person["programOutcome"],
    programRoutedAt: row.programRoutedAt,
    routedBy: row.routedBy,
    outcome: row.outcome as Person["outcome"],
  };
}

export function toPerson(row: PersonRow, history: HistoryEvent[]): Person {
  return { ...toPersonListItem(row), history };
}
