import { createFileRoute } from "@tanstack/react-router";
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
import { useStore } from "@/lib/store";
import { PROGRAMS } from "@/lib/data";
import { PageHeader } from "@/components/common";

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

function Analytics() {
  const { scopedPeople } = useStore();

  const detected = scopedPeople.filter((p) => p.neet || p.status === "Направлен на программу").length;
  const checked = scopedPeople.filter(
    (p) => p.neetReviewStatus === "Подтверждено" || p.neetReviewStatus === "На уточнении",
  ).length;
  const routed = scopedPeople.filter((p) => p.program).length;
  const succeeded = scopedPeople.filter(
    (p) => p.outcome === "Трудоустроен" || p.outcome === "Учится",
  ).length;

  const funnel = [
    { stage: "Выявлен", value: detected },
    { stage: "Проверен", value: checked },
    { stage: "Направлен на программу", value: routed },
    { stage: "Трудоустроен / учится", value: succeeded },
  ];

  const programRows = PROGRAMS.map((prog) => {
    const list = scopedPeople.filter((p) => p.program === prog);
    const ok = list.filter((p) => p.outcome === "Трудоустроен" || p.outcome === "Учится").length;
    return {
      program: prog,
      sent: list.length,
      ok,
      rate: list.length ? Math.round((ok / list.length) * 100) : 0,
    };
  });

  const months = ["Март", "Апрель", "Май", "Июнь", "Июль", "Август"];
  const monthly = months.map((m, i) => ({
    month: m,
    Направлено: Math.max(3, Math.round(routed / 6 + ((i * 5) % 7) - 2)),
    Трудоустроено: Math.max(1, Math.round(succeeded / 6 + ((i * 3) % 5) - 1)),
  }));

  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <div>
      <PageHeader
        title="Аналитика"
        subtitle="Эффективность сопровождения молодёжи и программ поддержки"
      />

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Воронка сопровождения</h2>
        <div className="mt-5 space-y-3">
          {funnel.map((f, i) => (
            <div key={f.stage}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{f.stage}</span>
                <span className="text-muted-foreground">
                  {f.value}
                  {i > 0 && funnel[i - 1]!.value > 0
                    ? ` · ${Math.round((f.value / funnel[i - 1]!.value) * 100)}% от пред. шага`
                    : ""}
                </span>
              </div>
              <div className="h-8 overflow-hidden rounded-lg bg-muted">
                <div
                  className="h-full rounded-lg bg-primary transition-all"
                  style={{ width: `${Math.max((f.value / maxFunnel) * 100, 3)}%`, opacity: 1 - i * 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Эффективность программ</h2>
          <div className="overflow-x-auto">
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
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Помесячная динамика направлений</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Направлено" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Трудоустроено" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Тренд успешных исходов</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="Трудоустроено" stroke="#059669" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
