import type { Mahalla, Person } from "./data";

export type Role =
  | "mahalla_officer"
  | "youth_rep"
  | "district_officer"
  | "employment_specialist"
  | "admin";

export type TabId = "dashboard" | "map" | "registry" | "review" | "programs" | "analytics";

export type Session = { role: Role; mahalla: Mahalla | null } | null;

export const ROLE_CONFIG = {
  mahalla_officer: {
    label: "Уполномоченный сотрудник махалли",
    description: "Доступ только к данным своей махалли",
    needsMahallaSelect: true,
    scope: "own_mahalla" as const,
    tabs: ["dashboard", "map", "registry", "review", "analytics"] as TabId[],
    landing: "/registry",
    can: {
      confirmStatus: true,
      requestClarification: true,
      clearFlag: true,
      moveKanban: true,
      routeToProgram: false,
      setOutcome: false,
      seeNames: true,
      editProfile: true,
      createRecord: true,
      generateReport: false,
    },
  },
  youth_rep: {
    label: "Представитель махалли по работе с молодёжью",
    description: "Доступ только к данным своей махалли",
    needsMahallaSelect: true,
    scope: "own_mahalla" as const,
    tabs: ["dashboard", "map", "registry", "review", "analytics"] as TabId[],
    landing: "/review",
    can: {
      confirmStatus: false,
      requestClarification: false,
      clearFlag: false,
      moveKanban: false,
      routeToProgram: true,
      setOutcome: false,
      seeNames: true,
      editProfile: false,
      createRecord: false,
      generateReport: false,
    },
  },
  district_officer: {
    label: "Уполномоченный сотрудник районного хокимията",
    description: "Доступ ко всем махаллям района, только сводные показатели",
    needsMahallaSelect: false,
    scope: "all_mahallas" as const,
    tabs: ["dashboard", "map", "analytics"] as TabId[],
    landing: "/",
    can: {
      confirmStatus: false,
      requestClarification: false,
      clearFlag: false,
      moveKanban: false,
      routeToProgram: false,
      setOutcome: false,
      seeNames: false,
      editProfile: false,
      createRecord: false,
      generateReport: true,
    },
  },
  employment_specialist: {
    label: "Уполномоченный специалист по занятости и социальной поддержке",
    description: "Доступ к молодёжи, направленной на программы, по всем махаллям",
    needsMahallaSelect: false,
    scope: "routed_only" as const,
    tabs: ["dashboard", "registry", "programs", "analytics"] as TabId[],
    landing: "/programs",
    can: {
      confirmStatus: false,
      requestClarification: false,
      clearFlag: false,
      moveKanban: false,
      routeToProgram: false,
      setOutcome: true,
      seeNames: true,
      editProfile: false,
      createRecord: false,
      generateReport: false,
    },
  },
  admin: {
    label: "Администратор системы",
    shortLabel: "Администратор",
    description: "Демонстрационный доступ ко всем разделам и данным",
    needsMahallaSelect: false,
    scope: "all_data" as const,
    tabs: ["dashboard", "map", "registry", "review", "programs", "analytics"] as TabId[],
    landing: "/",
    isSystemRole: true,
    can: {
      confirmStatus: true,
      requestClarification: true,
      clearFlag: true,
      moveKanban: true,
      routeToProgram: true,
      setOutcome: true,
      seeNames: true,
      editProfile: true,
      createRecord: true,
      generateReport: true,
    },
  },
} as const;

export const TAB_ROUTES: Record<TabId, string> = {
  dashboard: "/",
  map: "/map",
  registry: "/registry",
  review: "/review",
  programs: "/programs",
  analytics: "/analytics",
};

export const ROLES = Object.keys(ROLE_CONFIG) as Role[];

export const MAIN_ROLES = [
  "mahalla_officer",
  "youth_rep",
  "district_officer",
  "employment_specialist",
] as const satisfies readonly Role[];

export function getRoleConfig(role: Role) {
  return ROLE_CONFIG[role];
}

export function isOwnMahallaScope(role: Role) {
  return ROLE_CONFIG[role].scope === "own_mahalla";
}

export function getTerritoryLabel(session: NonNullable<Session>) {
  const config = ROLE_CONFIG[session.role];
  if (config.scope === "all_data") return "Полный доступ · все махалли";
  if (config.scope === "own_mahalla" && session.mahalla) {
    return `Махалля ${session.mahalla}`;
  }
  if (config.scope === "all_mahallas") return "Все 12 махаллей";
  return "Направленные · все махалли";
}

export function pathnameToTab(pathname: string): TabId | null {
  if (pathname === "/" || pathname === "") return "dashboard";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/registry")) return "registry";
  if (pathname.startsWith("/review")) return "review";
  if (pathname.startsWith("/programs")) return "programs";
  if (pathname.startsWith("/analytics")) return "analytics";
  return null;
}

export function migrateSession(raw: unknown): Session {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as { role?: string; mahalla?: Mahalla | null };
  if (s.role === "mahalla") return { role: "mahalla_officer", mahalla: s.mahalla ?? null };
  if (s.role === "district") return { role: "district_officer", mahalla: null };
  if (s.role && ROLES.includes(s.role as Role)) {
    return { role: s.role as Role, mahalla: s.mahalla ?? null };
  }
  return null;
}

export function scopePeople(people: Person[], session: NonNullable<Session>) {
  const config = ROLE_CONFIG[session.role];
  switch (config.scope) {
    case "own_mahalla":
      return session.mahalla ? people.filter((p) => p.mahalla === session.mahalla) : people;
    case "all_mahallas":
    case "all_data":
      return people;
    case "routed_only":
      return people.filter((p) => p.program != null);
  }
}

export function checkRouteAccess(
  session: NonNullable<Session>,
  pathname: string,
  people: Person[],
): { allowed: boolean; redirect: string } {
  const config = ROLE_CONFIG[session.role];

  if (pathname.startsWith("/person/")) {
    if (!config.can.seeNames) {
      return { allowed: false, redirect: config.landing };
    }
    const id = pathname.replace("/person/", "").split("/")[0] ?? "";
    const person = people.find((p) => p.id === id);
    if (person) {
      if (config.scope === "own_mahalla" && person.mahalla !== session.mahalla) {
        return { allowed: false, redirect: config.landing };
      }
      if (config.scope === "routed_only" && !person.program) {
        return { allowed: false, redirect: config.landing };
      }
      // all_data and all_mahallas: no person-level restrictions
    }
    return { allowed: true, redirect: config.landing };
  }

  const tab = pathnameToTab(pathname);
  if (tab === null) return { allowed: true, redirect: config.landing };
  if (!config.tabs.includes(tab)) {
    return { allowed: false, redirect: config.landing };
  }
  return { allowed: true, redirect: config.landing };
}
