import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, Briefcase, UserX, AlertTriangle, HelpCircle, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { MAHALLAS, daysAgo, isStale, neetMonthlyTrend } from "@/lib/data";
import { PageHeader, EmptyState, NeetBadge } from "@/components/common";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Дашборд — Yoshlar Radar" },
      {
        name: "description",
        content:
          "Ключевые показатели занятости молодёжи Мирзо-Улугбекского района: занятость, безработица, NEET.",
      },
      { property: "og:title", content: "Дашборд — Yoshlar Radar" },
      {
        property: "og:description",
        content: "Ключевые показатели занятости молодёжи по махаллям района.",
      },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["#1d4ed8", "#059669", "#d97706", "#dc2626", "#64748b", "#7c3aed", "#0891b2"];

function Dashboard() {
  const { scopedPeople, session } = useStore();
  const total = scopedPeople.length;
  const employed = scopedPeople.filter(
    (p) => p.status === "Работает" || p.status === "Предприниматель",
  ).length;
  const unemployed = scopedPeople.filter((p) => p.status === "Безработный").length;
  const neet = scopedPeople.filter((p) => p.neet).length;
  const unknown = scopedPeople.filter((p) => p.status === "Статус не уточнён").length;
  const stale = scopedPeople.filter(isStale).length;

  const statusData = Array.from(
    scopedPeople.reduce((m, p) => m.set(p.status, (m.get(p.status) ?? 0) + 1), new Map<string, number>()),
  ).map(([name, value]) => ({ name, value }));

  const mahallas =
    session?.role === "mahalla" && session.mahalla ? [session.mahalla] : [...MAHALLAS];

  const byMahalla = mahallas.map((m) => {
    const list = scopedPeople.filter((p) => p.mahalla === m);
    return {
      mahalla: m,
      Занятые: list.filter((p) => p.status === "Работает" || p.status === "Предприниматель").length,
      Учатся: list.filter((p) => p.status === "Учится").length,
      NEET: list.filter((p) => p.neet).length,
      Другое: list.filter(
        (p) => p.status === "Другая деятельность" || p.status === "Направлен на программу",
      ).length,
    };
  });

  const trend = neetMonthlyTrend(scopedPeople);

  const attention = scopedPeople
    .filter((p) => p.neet && p.neetReviewStatus === "Ожидает проверки")
    .sort((a, b) => daysAgo(b.lastUpdate) - daysAgo(a.lastUpdate))
    .slice(0, 5);

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div>
      <PageHeader
        title="Дашборд"
        subtitle={
          session?.role === "mahalla"
            ? `Махалля ${session.mahalla}`
            : "Сводные показатели по 12 махаллям района"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi icon={Users} label="Всего молодёжи" value={total} tone="primary" />
        <Kpi
          icon={Briefcase}
          label="Занятые"
          value={employed}
          hint={`${pct(employed)}% от общего числа`}
          tone="success"
        />
        <Kpi icon={UserX} label="Безработные" value={unemployed} hint={`${pct(unemployed)}%`} tone="danger" />
        <Kpi
          icon={AlertTriangle}
          label="NEET (требуют внимания)"
          value={neet}
          hint={`${pct(neet)}%`}
          tone="danger"
        />
        <Kpi icon={HelpCircle} label="Статус не уточнён" value={unknown} tone="warning" />
        <Kpi icon={Clock} label="Данные устарели (>90 дней)" value={stale} tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Распределение по статусам" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Структура занятости по махаллям" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={Math.max(280, byMahalla.length * 26)}>
            <BarChart data={byMahalla} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="mahalla" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Занятые" stackId="a" fill="#059669" />
              <Bar dataKey="Учатся" stackId="a" fill="#1d4ed8" />
              <Bar dataKey="Другое" stackId="a" fill="#94a3b8" />
              <Bar dataKey="NEET" stackId="a" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Динамика NEET за 6 месяцев" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="neet" name="NEET" stroke="#dc2626" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Требуют внимания">
          {attention.length === 0 ? (
            <EmptyState text="Нет ожидающих проверки случаев NEET." />
          ) : (
            <ul className="space-y-2">
              {attention.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/person/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.fullName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.mahalla} · {p.age} лет · ожидает {daysAgo(p.lastUpdate)} дн.
                      </span>
                    </span>
                    <NeetBadge />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/15 text-warning",
};

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint?: string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <span className={`flex size-9 items-center justify-center rounded-lg ${TONES[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
