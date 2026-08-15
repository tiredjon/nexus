import { useMemo } from "react";
import type {
  DesiredDirection,
  EducationLevel,
  EmploymentStatus,
  MaritalStatus,
  Person,
  Program,
  ProgramOutcome,
  ReviewStatus,
  UpdateSource,
} from "@/lib/data";
import type { Role, Session } from "@/lib/permissions";
import type { PriorityLevel, PriorityReason } from "@/lib/person-compute";
import { useLanguage } from "./context";
import {
  formatLocaleDate,
  translateActivity,
  translateHistoryTitle,
  translateRoutedBy,
} from "./display";
import type { TranslationKey } from "./ru";

const STATUS_KEYS: Record<EmploymentStatus, TranslationKey> = {
  Работает: "enum.status.works",
  Безработный: "enum.status.unemployed",
  Учится: "enum.status.studying",
  Предприниматель: "enum.status.entrepreneur",
  "Другая деятельность": "enum.status.other",
  "Статус не уточнён": "enum.status.unknown",
  "Направлен на программу": "enum.status.program",
};

const REVIEW_KEYS: Record<ReviewStatus, TranslationKey> = {
  "Ожидает проверки": "enum.review.pending",
  "На уточнении": "enum.review.clarifying",
  Подтверждено: "enum.review.confirmed",
  "Флаг снят": "enum.review.cleared",
};

const PROGRAM_KEYS: Record<Program, TranslationKey> = {
  "Профессиональное обучение": "enum.program.vocational",
  "Содействие в трудоустройстве": "enum.program.employment",
  "Программа поддержки бизнеса": "enum.program.business",
  "Возвращение к обучению": "enum.program.returnStudy",
  "Молодёжная стажировка": "enum.program.internship",
};

const OUTCOME_KEYS: Record<ProgramOutcome, TranslationKey> = {
  Ожидает: "enum.outcome.waiting",
  Приступил: "enum.outcome.started",
  Завершил: "enum.outcome.completed",
  Трудоустроен: "enum.outcome.employed",
  "Не явился": "enum.outcome.noShow",
  Отказался: "enum.outcome.refused",
};

const EDUCATION_KEYS: Record<EducationLevel, TranslationKey> = {
  Среднее: "enum.education.secondary",
  "Среднее специальное": "enum.education.secondarySpecial",
  Колледж: "enum.education.college",
  Бакалавр: "enum.education.bachelor",
  Магистр: "enum.education.master",
};

const DIRECTION_KEYS: Record<DesiredDirection, TranslationKey> = {
  Трудоустройство: "enum.direction.employment",
  "Профессиональное обучение": "enum.direction.vocational",
  Предпринимательство: "enum.direction.business",
  "Возвращение к обучению": "enum.direction.returnStudy",
  "Не определился": "enum.direction.undecided",
};

const SOURCE_KEYS: Record<UpdateSource, TranslationKey> = {
  "Подворный обход": "enum.source.doorToDoor",
  Самообращение: "enum.source.self",
  "Синхронизация реестра": "enum.source.sync",
  "Телефонный звонок": "enum.source.phone",
  "Уточнение данных": "enum.source.clarification",
  "Обращение махаллинского комитета": "enum.source.committee",
};

const PRIORITY_KEYS: Record<PriorityLevel, TranslationKey> = {
  Высокий: "enum.priority.high",
  Средний: "enum.priority.medium",
  Обычный: "enum.priority.normal",
};

const ROLE_LABEL_KEYS: Record<Role, TranslationKey> = {
  mahalla_officer: "role.mahalla_officer.label",
  youth_rep: "role.youth_rep.label",
  district_officer: "role.district_officer.label",
  employment_specialist: "role.employment_specialist.label",
  admin: "role.admin.label",
};

const ROLE_DESC_KEYS: Record<Role, TranslationKey> = {
  mahalla_officer: "role.mahalla_officer.desc",
  youth_rep: "role.youth_rep.desc",
  district_officer: "role.district_officer.desc",
  employment_specialist: "role.employment_specialist.desc",
  admin: "role.admin.desc",
};

const LOGIN_ROLE_KEYS: Record<
  "mahalla_officer" | "youth_rep" | "district_officer" | "employment_specialist",
  TranslationKey
> = {
  mahalla_officer: "login.role.mahalla_officer",
  youth_rep: "login.role.youth_rep",
  district_officer: "login.role.district_officer",
  employment_specialist: "login.role.employment_specialist",
};

export function useLabels() {
  const { t, locale } = useLanguage();

  return useMemo(
    () => ({
      status: (value: EmploymentStatus) => t(STATUS_KEYS[value]),
      review: (value: ReviewStatus) => t(REVIEW_KEYS[value]),
      program: (value: Program) => t(PROGRAM_KEYS[value]),
      outcome: (value: ProgramOutcome) => t(OUTCOME_KEYS[value]),
      education: (value: EducationLevel) => t(EDUCATION_KEYS[value]),
      direction: (value: DesiredDirection) => t(DIRECTION_KEYS[value]),
      source: (value: UpdateSource) => t(SOURCE_KEYS[value]),
      priority: (value: PriorityLevel) => t(PRIORITY_KEYS[value]),
      roleLabel: (role: Role) => t(ROLE_LABEL_KEYS[role]),
      roleDesc: (role: Role) => t(ROLE_DESC_KEYS[role]),
      loginRole: (
        role: "mahalla_officer" | "youth_rep" | "district_officer" | "employment_specialist",
      ) => t(LOGIN_ROLE_KEYS[role]),
      historyTitle: (title: string) =>
        translateHistoryTitle(title, t, {
          status: (value) => t(STATUS_KEYS[value]),
          program: (value) => t(PROGRAM_KEYS[value]),
          outcome: (value) => t(OUTCOME_KEYS[value]),
          review: (value) => t(REVIEW_KEYS[value]),
        }),
      activity: (value: string) => translateActivity(value, t),
      routedBy: (value: string) => translateRoutedBy(value, t),
      formatDate: (iso: string) => formatLocaleDate(iso, locale),
      territory: (session: NonNullable<Session>) => {
        if (session.role === "admin") return t("territory.fullAccess");
        if (session.mahalla) return t("territory.mahalla", { name: session.mahalla });
        if (session.role === "district_officer") return t("territory.allMahallas");
        if (session.role === "employment_specialist") return t("territory.routedAll");
        return t("territory.allMahallas");
      },
      gender: (value: "Мужской" | "Женский") =>
        value === "Мужской" ? t("enum.gender.male") : t("enum.gender.female"),
      genderShort: (value: "Мужской" | "Женский") =>
        value === "Мужской" ? t("enum.gender.shortM") : t("enum.gender.shortF"),
      marital: (p: Pick<Person, "gender" | "maritalStatus">) => {
        if (p.maritalStatus === "Женат/замужем") {
          return p.gender === "Мужской" ? t("enum.marital.marriedM") : t("enum.marital.marriedF");
        }
        return p.gender === "Мужской" ? t("enum.marital.singleM") : t("enum.marital.singleF");
      },
      maritalCombined: (value: MaritalStatus) =>
        value === "Женат/замужем"
          ? t("enum.marital.combinedMarried")
          : t("enum.marital.combinedSingle"),
      formatExperience: (months: number) => {
        if (months <= 0) return t("format.experience.none");
        const years = Math.floor(months / 12);
        const rem = months % 12;
        const yearWord =
          years === 1
            ? t("format.experience.year1", { n: years })
            : years >= 2 && years <= 4
              ? t("format.experience.year2", { n: years })
              : years > 0
                ? t("format.experience.years", { n: years })
                : "";
        if (years === 0) return t("format.experience.months", { n: rem });
        if (rem === 0) return yearWord;
        return `${yearWord} ${t("format.experience.months", { n: rem })}`;
      },
      priorityReason: (reason: PriorityReason) => {
        switch (reason.kind) {
          case "inColumn":
            return t("priority.reason.inColumn", {
              status: t(REVIEW_KEYS[reason.status]),
              days: reason.days,
            });
          case "stale120":
            return t("priority.reason.stale120", { days: reason.days });
          case "stale60":
            return t("priority.reason.stale60", { days: reason.days });
          case "temirDaftar":
            return t("priority.reason.temirDaftar");
          case "yoshlarAyollar":
            return t("priority.reason.yoshlarAyollar");
          case "breadwinner":
            return t("priority.reason.breadwinner");
          case "secondaryNoExp":
            return t("priority.reason.secondaryNoExp");
          case "noSkills":
            return t("priority.reason.noSkills");
        }
      },
      caseCount: (count: number) => {
        const mod10 = count % 10;
        const mod100 = count % 100;
        if (mod10 === 1 && mod100 !== 11) return t("dash.case.one");
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return t("dash.case.few");
        return t("dash.case.many");
      },
    }),
    [t, locale],
  );
}

export {
  STATUS_KEYS,
  REVIEW_KEYS,
  PROGRAM_KEYS,
  OUTCOME_KEYS,
  EDUCATION_KEYS,
  DIRECTION_KEYS,
  SOURCE_KEYS,
  PRIORITY_KEYS,
};
