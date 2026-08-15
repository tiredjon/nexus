import { memo, useMemo } from "react";

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

import { useStore, useRoleConfig } from "@/lib/store";

import { MAHALLAS, daysAgo, isStale, neetMonthlyTrend, shortName, type EmploymentStatus } from "@/lib/data";

import { isOwnMahallaScope } from "@/lib/permissions";

import { useLanguage, useLabels, type TranslationKey } from "@/lib/i18n";

import { PageHeader, EmptyState, NeetBadge, YR_CARD, YR_CARD_INTERACTIVE } from "@/components/common";

import { DashboardAiSummary } from "@/components/DashboardAiSummary";



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

const MONTH_KEYS = [
  "analytics.month.mar",
  "analytics.month.apr",
  "analytics.month.may",
  "analytics.month.jun",
  "analytics.month.jul",
  "analytics.month.aug",
] as const satisfies readonly TranslationKey[];



function Dashboard() {

  const { scopedPeople, session, people, syncedAt } = useStore();

  const roleConfig = useRoleConfig();

  const { t } = useLanguage();

  const labels = useLabels();

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

    session && isOwnMahallaScope(session.role) && session.mahalla

      ? [session.mahalla]

      : [...MAHALLAS];



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



  const trend = useMemo(
    () =>
      neetMonthlyTrend(scopedPeople).map((row, i) => ({
        ...row,
        month: t(MONTH_KEYS[i]!),
      })),
    [scopedPeople, t],
  );



  const attention = scopedPeople

    .filter((p) => p.neet && p.neetReviewStatus === "Ожидает проверки")

    .sort((a, b) => daysAgo(b.lastUpdate) - daysAgo(a.lastUpdate))

    .slice(0, 5);



  const attentionByMahalla = [...MAHALLAS]

    .map((m) => ({

      mahalla: m,

      count: people.filter(

        (p) => p.mahalla === m && p.neet && p.neetReviewStatus === "Ожидает проверки",

      ).length,

    }))

    .filter((x) => x.count > 0)

    .sort((a, b) => b.count - a.count);



  const showNames = roleConfig?.can.seeNames !== false;



  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);



  const subtitle =

    session && isOwnMahallaScope(session.role)

      ? labels.territory(session)

      : session?.role === "employment_specialist"

        ? t("dash.subtitle.programs")

        : t("dash.subtitle.district");



  return (

    <div>

      <PageHeader title={t("dash.title")} subtitle={subtitle} />



      {session && (

        <DashboardAiSummary

          scopedPeople={scopedPeople}

          allPeople={people}

          role={session.role}

          {...(session.mahalla ? { mahalla: session.mahalla } : {})}

          syncedAt={syncedAt}

        />

      )}



      <div className="yr-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <Kpi icon={Users} label={t("dash.kpi.total")} value={total} tone="primary" />

        <Kpi

          icon={Briefcase}

          label={t("dash.kpi.employed")}

          value={employed}

          hint={t("dash.kpi.pctOfTotal", { pct: pct(employed) })}

          tone="success"

        />

        <Kpi

          icon={UserX}

          label={t("dash.kpi.unemployed")}

          value={unemployed}

          hint={t("dash.kpi.pct", { pct: pct(unemployed) })}

          tone="danger"

        />

        <Kpi

          icon={AlertTriangle}

          label={t("dash.kpi.neet")}

          value={neet}

          hint={t("dash.kpi.pct", { pct: pct(neet) })}

          tone="danger"

        />

        <Kpi icon={HelpCircle} label={t("dash.kpi.unknown")} value={unknown} tone="warning" />

        <Kpi icon={Clock} label={t("dash.kpi.stale")} value={stale} tone="warning" />

      </div>



      <div className="mt-6 grid gap-4 lg:grid-cols-3">

        <Card title={t("dash.chart.statusDistribution")} className="lg:col-span-1">

          <StatusPieChart data={statusData} />

        </Card>



        <Card title={t("dash.chart.mahallaStructure")} className="lg:col-span-2">

          <MahallaBarChart data={byMahalla} height={Math.max(280, byMahalla.length * 26)} />

        </Card>

      </div>



      <div className="mt-4 grid gap-4 lg:grid-cols-3">

        <Card title={t("dash.chart.neetTrend")} className="lg:col-span-2">

          <NeetTrendChart data={trend} />

        </Card>



        <Card title={t("dash.chart.attention")}>

          {!showNames ? (

            attentionByMahalla.length === 0 ? (

              <EmptyState text={t("dash.empty.neet")} />

            ) : (

              <>

                <ul className="space-y-2">

                  {attentionByMahalla.map((x) => (

                    <li

                      key={x.mahalla}

                      className="flex items-center justify-between rounded-xl border border-border p-3"

                    >

                      <span className="text-sm font-medium">{x.mahalla}</span>

                      <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">

                        {x.count} {labels.caseCount(x.count)}

                      </span>

                    </li>

                  ))}

                </ul>

                <p className="mt-3 text-xs text-muted-foreground">{t("dash.privacyNote")}</p>

              </>

            )

          ) : attention.length === 0 ? (

            <EmptyState text={t("dash.empty.neet")} />

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

                      <span className="block truncate text-sm font-medium">{shortName(p)}</span>

                      <span className="block text-xs text-muted-foreground">

                        {p.mahalla} · {t("common.yearsOld", { age: p.age })} ·{" "}

                        {t("dash.waitingDays", { days: daysAgo(p.lastUpdate) })}

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

    <div className={YR_CARD_INTERACTIVE + " p-5"}>

      <div className="flex items-start justify-between">

        <div>

          <div className="text-sm text-muted-foreground">{label}</div>

          <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>

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

    <section className={`${YR_CARD} p-5 ${className}`}>

      <h2 className="mb-4 text-base font-medium">{title}</h2>

      {children}

    </section>

  );

}



const StatusPieChart = memo(function StatusPieChart({

  data,

}: {

  data: { name: string; value: number }[];

}) {

  const labels = useLabels();



  return (

    <ResponsiveContainer width="100%" height={280}>

      <PieChart>

        <Pie

          data={data}

          dataKey="value"

          nameKey="name"

          innerRadius={60}

          outerRadius={95}

          paddingAngle={2}

        >

          {data.map((_, i) => (

            <Cell key={i} fill={COLORS[i % COLORS.length]} />

          ))}

        </Pie>

        <Tooltip

          formatter={(value: number, name: string) => [

            value,

            labels.status(name as EmploymentStatus),

          ]}

        />

        <Legend

          wrapperStyle={{ fontSize: 11 }}

          formatter={(value: string) => labels.status(value as EmploymentStatus)}

        />

      </PieChart>

    </ResponsiveContainer>

  );

});



const MahallaBarChart = memo(function MahallaBarChart({

  data,

  height,

}: {

  data: {

    mahalla: string;

    Занятые: number;

    Учатся: number;

    NEET: number;

    Другое: number;

  }[];

  height: number;

}) {

  const { t } = useLanguage();



  return (

    <ResponsiveContainer width="100%" height={height}>

      <BarChart data={data} layout="vertical" margin={{ left: 40 }}>

        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />

        <XAxis type="number" tick={{ fontSize: 11 }} />

        <YAxis dataKey="mahalla" type="category" width={110} tick={{ fontSize: 11 }} />

        <Tooltip />

        <Legend wrapperStyle={{ fontSize: 11 }} />

        <Bar dataKey="Занятые" name={t("dash.series.employed")} stackId="a" fill="#059669" />

        <Bar dataKey="Учатся" name={t("dash.series.studying")} stackId="a" fill="#1d4ed8" />

        <Bar dataKey="Другое" name={t("dash.series.other")} stackId="a" fill="#94a3b8" />

        <Bar dataKey="NEET" name="NEET" stackId="a" fill="#dc2626" />

      </BarChart>

    </ResponsiveContainer>

  );

});



const NeetTrendChart = memo(function NeetTrendChart({

  data,

}: {

  data: { month: string; neet: number }[];

}) {

  return (

    <ResponsiveContainer width="100%" height={260}>

      <LineChart data={data}>

        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

        <XAxis dataKey="month" tick={{ fontSize: 11 }} />

        <YAxis tick={{ fontSize: 11 }} />

        <Tooltip />

        <Line type="monotone" dataKey="neet" name="NEET" stroke="#dc2626" strokeWidth={2.5} dot />

      </LineChart>

    </ResponsiveContainer>

  );

});


