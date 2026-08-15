import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  buildFullName,
  generatePeople,
  type Person,
  type Program,
  type ProgramOutcome,
  type ReviewStatus,
  type UpdateSource,
} from "./data";
import {
  computeNeet,
  computeSignalReasons,
} from "./person-compute";
import {
  getRoleConfig,
  migrateSession,
  scopePeople,
  type Session,
} from "./permissions";

export type { Role, Session } from "./permissions";

export type PersonEditableFields = Pick<
  Person,
  | "status"
  | "activity"
  | "isFormalEmployment"
  | "workExperienceMonths"
  | "educationLevel"
  | "educationInstitution"
  | "specialty"
  | "skills"
  | "languages"
  | "hasDriverLicense"
  | "desiredDirection"
  | "householdSize"
  | "maritalStatus"
  | "isBreadwinner"
  | "streetBlock"
>;

export type CreatePersonInput = {
  lastName: string;
  firstName: string;
  patronymic: string;
  gender: Person["gender"];
  birthDate: string;
  mahalla: Person["mahalla"];
  streetBlock: string;
  educationLevel: Person["educationLevel"];
  educationInstitution: string | null;
  specialty: string | null;
  status: Person["status"];
  activity: string;
  isFormalEmployment: boolean;
  workExperienceMonths: number;
  skills: string[];
  desiredDirection: Person["desiredDirection"];
  householdSize: number;
  maritalStatus: Person["maritalStatus"];
  lastUpdateSource: UpdateSource;
};

type Ctx = {
  loading: boolean;
  people: Person[];
  scopedPeople: Person[];
  session: Session;
  syncedAt: Date;
  signIn: (s: NonNullable<Session>) => void;
  signOut: () => void;
  routeToProgram: (id: string, program: Program, comment: string) => void;
  confirmStatus: (id: string) => void;
  requestClarification: (id: string) => void;
  setReviewStatus: (id: string, status: ReviewStatus) => void;
  setProgramOutcome: (id: string, outcome: ProgramOutcome, comment?: string) => void;
  updatePerson: (
    id: string,
    changes: Partial<PersonEditableFields>,
    source: UpdateSource,
    changedLabels: string[],
    options?: { historyTitle?: string },
  ) => void;
  createPerson: (input: CreatePersonInput) => string;
};

const StoreContext = createContext<Ctx | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function applyDerivedFields(p: Person): Person {
  const neet = computeNeet(p);
  computeSignalReasons(p);
  return {
    ...p,
    neet,
    hasProfession: p.skills.length > 0 || p.specialty != null,
    businessInterest: p.desiredDirection === "Предпринимательство",
    droppedStudies:
      p.graduationYear === null && p.status !== "Учится" && p.educationLevel !== "Среднее",
  };
}

function nextPersonId(people: Person[]): string {
  const nums = people.map((p) => {
    const match = p.id.match(/^Y-(\d+)$/);
    return match ? Number.parseInt(match[1]!, 10) : 0;
  });
  return `Y-${Math.max(...nums, 999) + 1}`;
}

function officerFromSession(session: Session): string {
  if (!session) return "Сотрудник махалли";
  const label = getRoleConfig(session.role).label;
  return session.mahalla ? `${label} · ${session.mahalla}` : label;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);
  const [syncedAt] = useState(() => new Date(Date.now() - 42 * 60 * 1000));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("yr-session");
      if (raw) setSession(migrateSession(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => {
      setPeople(generatePeople(250));
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const update = useCallback((id: string, fn: (p: Person) => Person) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));
  }, []);

  const value = useMemo<Ctx>(() => {
    const scopedPeople = session ? scopePeople(people, session) : people;

    return {
      loading,
      people,
      scopedPeople,
      session,
      syncedAt,
      signIn: (s) => {
        setSession(s);
        try {
          localStorage.setItem("yr-session", JSON.stringify(s));
        } catch {
          /* ignore */
        }
      },
      signOut: () => {
        setSession(null);
        try {
          localStorage.removeItem("yr-session");
        } catch {
          /* ignore */
        }
      },
      routeToProgram: (id, program, comment) =>
        update(id, (p) => {
          const routedAt = today();
          const label = session ? getRoleConfig(session.role).label : "Сотрудник";
          const mahallaNote = session?.mahalla ? ` · ${session.mahalla}` : "";
          return applyDerivedFields({
            ...p,
            program,
            programOutcome: "Ожидает",
            programRoutedAt: routedAt,
            routedBy: `${label}${mahallaNote}`,
            status: "Направлен на программу",
            outcome: "В процессе",
            lastUpdate: routedAt,
            neetReviewStatus: "Подтверждено",
            history: [
              ...p.history,
              {
                date: routedAt,
                title: `Направлен на программу: ${program}`,
                note: comment || undefined,
                source: "программа",
              },
            ],
          });
        }),
      confirmStatus: (id) =>
        update(id, (p) =>
          applyDerivedFields({
            ...p,
            lastUpdate: today(),
            neetReviewStatus: p.neet ? "Подтверждено" : p.neetReviewStatus,
            history: [...p.history, { date: today(), title: "Статус подтверждён сотрудником" }],
          }),
        ),
      requestClarification: (id) =>
        update(id, (p) => ({
          ...p,
          neetReviewStatus: "На уточнении",
          history: [...p.history, { date: today(), title: "Запрошено уточнение данных" }],
        })),
      setReviewStatus: (id, status) =>
        update(id, (p) => ({
          ...p,
          neetReviewStatus: status,
          lastUpdate: today(),
          history: [...p.history, { date: today(), title: `Проверка NEET: ${status}` }],
        })),
      setProgramOutcome: (id, outcome, comment) =>
        update(id, (p) => {
          const updates: Person = {
            ...p,
            programOutcome: outcome,
            history: [
              ...p.history,
              {
                date: today(),
                title: `Исход участия: ${outcome}`,
                source: "программа",
                note: comment || undefined,
              },
            ],
          };
          if (outcome === "Трудоустроен") {
            updates.status = "Работает";
            updates.lastUpdate = today();
            updates.outcome = "Трудоустроен";
          } else if (outcome === "Завершил" || outcome === "Приступил") {
            updates.outcome = "В процессе";
          }
          return applyDerivedFields(updates);
        }),
      updatePerson: (id, changes, source, changedLabels, options) =>
        update(id, (p) => {
          const updated = applyDerivedFields({
            ...p,
            ...changes,
            educationInstitution: changes.educationInstitution ?? p.educationInstitution,
            specialty: changes.specialty ?? p.specialty,
            lastUpdate: today(),
            lastUpdateSource: source,
            history: [
              ...p.history,
              {
                date: today(),
                title:
                  options?.historyTitle ??
                  `Данные уточнены: ${changedLabels.join(", ")}`,
                source,
              },
            ],
          });
          return updated;
        }),
      createPerson: (input) => {
        const id = nextPersonId(people);
        const age = calcAge(input.birthDate);
        const fullName = buildFullName(
          input.gender,
          input.lastName,
          input.firstName,
          input.patronymic,
        );
        const neet = computeNeet({ status: input.status });
        const createdAt = today();

        const person: Person = applyDerivedFields({
          id,
          lastName: input.lastName,
          firstName: input.firstName,
          patronymic: input.patronymic,
          fullName,
          age,
          birthDate: input.birthDate,
          gender: input.gender,
          mahalla: input.mahalla,
          streetBlock: input.streetBlock || "—",
          educationLevel: input.educationLevel,
          educationInstitution: input.educationInstitution,
          graduationYear: null,
          specialty: input.specialty,
          status: input.status,
          activity: input.activity || "—",
          employer: null,
          isFormalEmployment: input.isFormalEmployment,
          workExperienceMonths: input.workExperienceMonths,
          skills: input.skills,
          desiredDirection: input.desiredDirection,
          hasDriverLicense: input.skills.includes("водительские права B"),
          languages: ["узбекский", "русский"],
          inYoshlarDaftari: false,
          inAyollarDaftari: false,
          familyInTemirDaftar: false,
          householdSize: input.householdSize,
          maritalStatus: input.maritalStatus,
          hasChildren: false,
          isBreadwinner: false,
          lastUpdate: createdAt,
          lastUpdateSource: input.lastUpdateSource,
          responsibleOfficer: officerFromSession(session),
          needsSupport: neet,
          neet,
          neetReviewStatus: neet ? "Ожидает проверки" : "Флаг снят",
          hasProfession: input.skills.length > 0 || input.specialty != null,
          businessInterest: input.desiredDirection === "Предпринимательство",
          droppedStudies: input.educationLevel !== "Среднее" && input.status !== "Учится",
          history: [
            {
              date: createdAt,
              title: "Первичный учёт: внесено сотрудником махалли",
              source: input.lastUpdateSource,
            },
          ],
          program: null,
          programOutcome: null,
          programRoutedAt: null,
          routedBy: null,
          outcome: null,
        });

        setPeople((prev) => [...prev, person]);
        return id;
      },
    };
  }, [people, loading, session, syncedAt, update]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useRoleConfig() {
  const { session } = useStore();
  if (!session) return null;
  return getRoleConfig(session.role);
}
