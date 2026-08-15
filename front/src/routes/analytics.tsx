import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useStore, useRoleConfig } from "@/lib/store";
import { PROGRAMS, daysAgo, type Person } from "@/lib/data";
import { EmptyState, PageHeader, YR_CARD } from "@/components/common";
import { OfficialReportDialog } from "@/components/OfficialReportDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Аналитика — Yoshlar Radar" },
      {
        name: "description",
        content: "Воронка сопровождения, эффективность программ поддержки и месячные тренды.",
      },
      { property: "og:title", content: "Аналитика — Yoshlar Radar" },
      { property: "og:description", content: "Эффективность программ поддержки молодёжи." },
    ],
  }),
  component: Analytics,
});

type FocusMode = "results" | "losses";

function buildFunnel(people: Person[]) {
  const detectedList = people.filter((p) => p.neet);
  const checkedList = detectedList.filter((p) => p.neetReviewStatus !== "Ожидает проверки");
  const routedList = checkedList.filter((p) => p.program != null);
  const resultList = routedList.filter(
    (p) => p.programOutcome === "Трудоустроен" || p.status === "Учится",
  );

  const raw = [
    { stage: "Выявлен", value: detectedList.length },
    { stage: "Проверен", value: checkedList.length },
    { stage: "Направлен на программу", value: routedList.length },
    { stage: "Трудоустроен / учится", value: resultList.length },
  ];

  const capped = raw.map((step, i) => {
    if (i === 0) return step;
    const prev = raw[i - 1]!.value;
    if (step.value > prev) {
      return { ...step, value: prev };
    }
    return step;
  });

  return capped;
}

function withoutResultCount(people: Person[]) {
  return people.filter(
    (p) =>
      p.program &&
      (p.programOutcome === "Не явился" ||
        p.programOutcome === "Отказался" ||
        (p.programOutcome === "Ожидает" &&
          p.programRoutedAt != null &&
          daysAgo(p.programRoutedAt) > 60)),
  ).length;
}

function Analytics() {
  const { scopedPeople, people } = useStore();
  const roleConfig = useRoleConfig();
  const [focus, setFocus] = useState<FocusMode>("results");
  const [reportOpen, setReportOpen] = useState(false);

  const funnel = useMemo(() => buildFunnel(scopedPeople), [scopedPeople]);
  const funnelEmpty = funnel[0]!.value === 0 && roleConfig?.scope === "routed_only";
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);
  const lossesMode = focus === "losses";

  const programRows = useMemo(() => {
    return PROGRAMS.map((prog) => {
      const list = scopedPeople.filter((p) => p.program === prog);
      const ok = list.filter(
        (p) =>
          p.programOutcome === "Трудоустроен" ||
          p.programOutcome === "Завершил" ||
          p.outcome === "Трудоустроен" ||
          p.outcome === "Учится",
      ).length;
      const noShow = list.filter((p) => p.programOutcome === "Не явился").length;
      const refused = list.filter((p) => p.programOutcome === "Отказался").length;
      const incomplete = list.filter(
        (p) => p.programOutcome === "Ожидает" || p.programOutcome === "Приступил",
      ).length;
      const unsuccessful = list.length - ok;
      const lossRate = list.length ? Math.round((unsuccessful / list.length) * 100) : 0;

      return {
        program: prog,
        sent: list.length,
        ok,
        rate: list.length ? Math.round((ok / list.length) * 100) : 0,
        noShow,
        refused,
        incomplete,
        lossRate,
      };
    });
  }, [scopedPeople]);

  const programLossRows = useMemo(
    () => [...programRows].sort((a, b) => b.lossRate - a.lossRate),
    [programRows],
  );

  const routed = scopedPeople.filter((p) => p.program).length;
  const succeeded = funnel[3]!.value;
  const withoutResult = withoutResultCount(scopedPeople);

  const months = ["Март", "Апрель", "Май", "Июнь", "Июль", "Август"];
  const monthly = months.map((m, i) => ({
    month: m,
    Направлено: Math.max(3, Math.round(routed / 6 + ((i * 5) % 7) - 2)),
    Трудоустроено: Math.max(1, Math.round(succeeded / 6 + ((i * 3) % 5) - 1)),
    "Без результата": Math.max(0, Math.round(withoutResult / 6 + ((i * 2) % 4) - 1)),
  }));

  const dropoutCheckToRoute = Math.max(0, funnel[1]!.value - funnel[2]!.value);
  const worstProgram = programLossRows.find((r) => r.sent > 0);
  const staleAwaiting = scopedPeople.filter(
    (p) =>
      p.program &&
      p.programOutcome === "Ожидает" &&
      p.programRoutedAt &&
      daysAgo(p.programRoutedAt) > 60,
  ).length;
  const pendingReview = scopedPeople.filter(
    (p) => p.neet && p.neetReviewStatus === "Ожидает проверки",
  ).length;

  const lossInsights = [
    {
      text: `Наибольший отсев между проверкой и направлением: ${dropoutCheckToRoute} человек`,
      to: "/review" as const,
    },
    worstProgram
      ? {
          text: `Программа с худшим результатом: ${worstProgram.program}, ${worstProgram.lossRate}% потерь`,
          to: "/programs" as const,
          search: { program: worstProgram.program },
        }
      : null,
    {
      text: `Дольше 60 дней без исхода: ${staleAwaiting} человек`,
      to: "/programs" as const,
      search: { outcome: "Ожидает" },
    },
    {
      text: `Сигналы, не дошедшие до проверки: ${pendingReview}`,
      to: "/review" as const,
    },
  ].filter(Boolean) as {
    text: string;
    to: "/programs" | "/review";
    search?: { program?: string; outcome?: string };
  }[];

  return (
    <div>
      <PageHeader
        title="Аналитика"
        subtitle={
          lossesMode
            ? "Где система теряет людей — точки отсева и незавершённые случаи"
            : "Эффективность сопровождения молодёжи и программ поддержки"
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setFocus("results")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                focus === "results"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Результаты
            </button>
            <button
              type="button"
              onClick={() => setFocus("losses")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                focus === "losses"
                  ? "bg-[#b45309] text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Потери
            </button>
          </div>
          {roleConfig?.can.generateReport && (
            <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
              <FileText className="size-4" /> Сформировать справку
            </Button>
          )}
        </div>
      </PageHeader>

      <OfficialReportDialog open={reportOpen} onOpenChange={setReportOpen} people={people} />

      <section className={`${YR_CARD} p-5`}>
        <h2 className="text-base font-medium">
          {lossesMode ? "Воронка сопровождения — точки потерь" : "Воронка сопровождения"}
        </h2>
        {funnelEmpty ? (
          <div className="mt-5">
            <EmptyState text="Недостаточно данных для воронки в текущем срезе." />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {funnel.map((f, i) => {
              const prev = i > 0 ? funnel[i - 1]!.value : f.value;
              const drop = i > 0 ? prev - f.value : 0;
              const dropPct = i > 0 && prev > 0 ? Math.round((drop / prev) * 100) : 0;

              return (
                <div key={f.stage}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">
                      {f.value}
                      {i > 0 && prev > 0
                        ? ` · ${Math.round((f.value / prev) * 100)}% от пред. шага`
                        : ""}
                    </span>
                  </div>
                  <div className="flex h-8 overflow-hidden rounded-lg bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-l-lg transition-all",
                        lossesMode ? "bg-primary/80" : "bg-primary",
                      )}
                      style={{
                        width: `${Math.max((f.value / maxFunnel) * 100, 3)}%`,
                        opacity: lossesMode ? 1 : 1 - i * 0.15,
                      }}
                    />
                    {lossesMode && i > 0 && drop > 0 && (
                      <div
                        className="h-full bg-[#fed7aa]"
                        style={{ width: `${Math.max((drop / maxFunnel) * 100, 1)}%` }}
                      />
                    )}
                  </div>
                  {lossesMode && i > 0 && drop > 0 && (
                    <p className="mt-1 text-xs text-[#b45309]">
                      Не дошли до этого шага: {drop} ({dropPct}% от предыдущего)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {lossesMode && (
        <section className={`mt-4 ${YR_CARD} p-5`}>
          <h2 className="mb-4 text-base font-medium">Основные точки потерь</h2>
          <ul className="space-y-2">
            {lossInsights.map((item) => (
              <li key={item.text}>
                <Link
                  to={item.to}
                  {...(item.search ? { search: item.search } : {})}
                  className="text-sm text-[#b45309] transition-colors duration-150 hover:underline"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className={`${YR_CARD} p-5`}>
          <h2 className="mb-4 text-base font-medium">
            {lossesMode ? "Эффективность программ — потери" : "Эффективность программ"}
          </h2>
          <div className="overflow-x-auto">
            {lossesMode ? (
              <table className="w-full text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Программа</th>
                    <th className="py-2 text-right font-medium">Направлено</th>
                    <th className="py-2 text-right font-medium">Не явились</th>
                    <th className="py-2 text-right font-medium">Отказались</th>
                    <th className="py-2 text-right font-medium">Не завершили</th>
                    <th className="py-2 text-right font-medium">Потери %</th>
                  </tr>
                </thead>
                <tbody>
                  {programLossRows.map((r) => (
                    <tr key={r.program} className="border-b border-border/60 last:border-0">
                      <td className="py-3">{r.program}</td>
                      <td className="py-3 text-right text-muted-foreground">{r.sent}</td>
                      <td className="py-3 text-right text-muted-foreground">{r.noShow}</td>
                      <td className="py-3 text-right text-muted-foreground">{r.refused}</td>
                      <td className="py-3 text-right text-muted-foreground">{r.incomplete}</td>
                      <td
                        className={cn(
                          "py-3 text-right font-semibold",
                          r.lossRate >= 70 ? "text-[#9f1239]" : "text-[#b45309]",
                        )}
                      >
                        {r.lossRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Программа</th>
                    <th className="py-2 text-right font-medium">Направлено</th>
                    <th className="py-2 text-right font-medium">Успешные исходы</th>
                    <th className="py-2 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {programRows.map((r) => (
                    <tr key={r.program} className="border-b border-border/60 last:border-0">
                      <td className="py-3">{r.program}</td>
                      <td className="py-3 text-right text-muted-foreground">{r.sent}</td>
                      <td className="py-3 text-right text-muted-foreground">{r.ok}</td>
                      <td className="py-3 text-right font-semibold text-success">{r.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className={`${YR_CARD} p-5`}>
          <h2 className="mb-4 text-base font-medium">Помесячная динамика направлений</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Направлено" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Трудоустроено" fill="#059669" radius={[4, 4, 0, 0]} />
              {lossesMode && (
                <Bar dataKey="Без результата" fill="#c2743a" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className={`mt-4 ${YR_CARD} p-5`}>
        <h2 className="mb-4 text-base font-medium">
          {lossesMode ? "Тренд неуспешных исходов" : "Тренд успешных исходов"}
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {lossesMode ? (
              <Line
                type="monotone"
                dataKey="Без результата"
                stroke="#b45309"
                strokeWidth={2.5}
              />
            ) : (
              <Line type="monotone" dataKey="Трудоустроено" stroke="#059669" strokeWidth={2.5} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
