import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { MAHALLAS, type Mahalla } from "@/lib/data";
import { PageHeader } from "@/components/common";
import type { MahallaStat } from "@/components/DistrictMap";

const DistrictMap = lazy(() => import("@/components/DistrictMap"));

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Карта района — Yoshlar Radar" },
      {
        name: "description",
        content:
          "Карта Мирзо-Улугбекского района: агрегированные показатели занятости молодёжи по махаллям.",
      },
      { property: "og:title", content: "Карта района — Yoshlar Radar" },
      { property: "og:description", content: "Агрегированные показатели NEET по махаллям." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { scopedPeople, session } = useStore();
  const list: Mahalla[] =
    session?.role === "mahalla" && session.mahalla ? [session.mahalla] : [...MAHALLAS];

  const stats: MahallaStat[] = list.map((m) => {
    const people = scopedPeople.filter((p) => p.mahalla === m);
    const neet = people.filter((p) => p.neet).length;
    return {
      mahalla: m,
      total: people.length,
      employed: people.filter((p) => p.status === "Работает" || p.status === "Предприниматель")
        .length,
      neet,
      share: people.length ? (neet / people.length) * 100 : 0,
    };
  });

  return (
    <div>
      <PageHeader
        title="Карта района"
        subtitle="Размер круга — численность молодёжи, цвет — доля NEET"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card p-2">
        <ClientOnly
          fallback={<div className="h-[540px] animate-pulse rounded-xl bg-muted" />}
        >
          <Suspense fallback={<div className="h-[540px] animate-pulse rounded-xl bg-muted" />}>
            <DistrictMap stats={stats} />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
        <Legend color="bg-success" label="Доля NEET < 5%" />
        <Legend color="bg-warning" label="Доля NEET 5–12%" />
        <Legend color="bg-danger" label="Доля NEET > 12%" />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Отображаются только агрегированные показатели по территориям. Точные адреса граждан не
          используются.
        </p>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
