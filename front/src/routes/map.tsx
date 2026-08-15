import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { MAHALLAS, type Mahalla } from "@/lib/data";
import { isOwnMahallaScope } from "@/lib/permissions";
import { mahallaColor, type ZoneColorMode } from "@/lib/mahalla-colors";
import { PageHeader } from "@/components/common";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  // По умолчанию карта показывает махалли разными цветами: район читается как
  // набор территорий. Статусная (красно-оранжевая) шкала — по переключателю.
  const [colorMode, setColorMode] = useState<ZoneColorMode>("mahalla");
  const list: Mahalla[] =
    session && isOwnMahallaScope(session.role) && session.mahalla
      ? [session.mahalla]
      : [...MAHALLAS];

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
        subtitle="Масштабируйте карту: Узбекистан → районы Ташкента → махалли Мирзо-Улугбек"
      />

      <div className="mb-3 flex justify-end">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={colorMode}
          // Radix отдаёт "" при попытке снять выбор — режим должен остаться выбранным.
          onValueChange={(value) => value && setColorMode(value as ZoneColorMode)}
          aria-label="Раскраска территорий"
        >
          <ToggleGroupItem value="neet">По статусу NEET</ToggleGroupItem>
          <ToggleGroupItem value="mahalla">По махаллям</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card p-2">
        <ClientOnly
          fallback={<div className="h-[540px] animate-pulse rounded-xl bg-muted" />}
        >
          <Suspense fallback={<div className="h-[540px] animate-pulse rounded-xl bg-muted" />}>
            <DistrictMap stats={stats} colorMode={colorMode} />
          </Suspense>
        </ClientOnly>
      </div>

      {colorMode === "neet" ? (
        <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
          <Legend color="bg-success" label="Доля NEET < 5%" />
          <Legend color="bg-warning" label="Доля NEET 5–12%" />
          <Legend color="bg-danger" label="Доля NEET > 12%" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-4">
          {list.map((mahalla) => (
            <span key={mahalla} className="inline-flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: mahallaColor(mahalla) }}
              />
              <span className="truncate">{mahalla}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Отображаются только агрегированные показатели по территориям. Точные адреса граждан не
          используются. Границы махаллей на карте являются приблизительными и служат для
          навигации, а не являются официальными кадастровыми границами.
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
