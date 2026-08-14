import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  generatePeople,
  type Mahalla,
  type Person,
  type Program,
  type ReviewStatus,
} from "./data";

export type Role = "mahalla" | "district";

export type Session = { role: Role; mahalla: Mahalla | null } | null;

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
};

const StoreContext = createContext<Ctx | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);
  const [syncedAt] = useState(() => new Date(Date.now() - 42 * 60 * 1000));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("yr-session");
      if (raw) setSession(JSON.parse(raw) as Session);
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
    const scopedPeople =
      session?.role === "mahalla" && session.mahalla
        ? people.filter((p) => p.mahalla === session.mahalla)
        : people;

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
        update(id, (p) => ({
          ...p,
          program,
          status: "Направлен на программу",
          outcome: "В процессе",
          lastUpdate: today(),
          neetReviewStatus: "Подтверждено",
          history: [
            ...p.history,
            {
              date: today(),
              title: `Направлен на программу: ${program}`,
              note: comment || undefined,
            },
          ],
        })),
      confirmStatus: (id) =>
        update(id, (p) => ({
          ...p,
          lastUpdate: today(),
          neetReviewStatus: p.neet ? "Подтверждено" : p.neetReviewStatus,
          history: [...p.history, { date: today(), title: "Статус подтверждён сотрудником" }],
        })),
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
    };
  }, [people, loading, session, syncedAt, update]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
