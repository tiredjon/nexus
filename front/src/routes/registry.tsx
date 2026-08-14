import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { MAHALLAS, STATUSES, isStale, type EmploymentStatus } from "@/lib/data";
import { EmptyState, FreshnessDot, NeetBadge, PageHeader, StatusBadge } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type Search = { mahalla?: string };

export const Route = createFileRoute("/registry")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s['mahalla'] === "string" ? { mahalla: s['mahalla'] } : {},
  head: () => ({
    meta: [
      { title: "Реестр молодёжи — Yoshlar Radar" },
      {
        name: "description",
        content: "Поиск и фильтрация профилей молодёжи по махаллям, статусу занятости и NEET.",
      },
      { property: "og:title", content: "Реестр молодёжи — Yoshlar Radar" },
      { property: "og:description", content: "Реестр молодёжи Мирзо-Улугбекского района." },
    ],
  }),
  component: Registry,
});

function Registry() {
  const { scopedPeople, session } = useStore();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const locked = session?.role === "mahalla";

  const [q, setQ] = useState("");
  const [mahalla, setMahalla] = useState<string>(search.mahalla ?? "all");
  const [status, setStatus] = useState<string>("all");
  const [ages, setAges] = useState<number[]>([18, 30]);
  const [onlyNeet, setOnlyNeet] = useState(false);
  const [onlySupport, setOnlySupport] = useState(false);
  const [onlyStale, setOnlyStale] = useState(false);
  const [sort, setSort] = useState<{ key: "fullName" | "age" | "mahalla" | "lastUpdate"; dir: 1 | -1 }>({
    key: "fullName",
    dir: 1,
  });

  const rows = useMemo(() => {
    const [minA, maxA] = [ages[0] ?? 18, ages[1] ?? 30];
    return scopedPeople
      .filter((p) => p.fullName.toLowerCase().includes(q.trim().toLowerCase()))
      .filter((p) => (locked || mahalla === "all" ? true : p.mahalla === mahalla))
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) => p.age >= minA && p.age <= maxA)
      .filter((p) => (onlyNeet ? p.neet : true))
      .filter((p) => (onlySupport ? p.needsSupport : true))
      .filter((p) => (onlyStale ? isStale(p) : true))
      .sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), "ru") * sort.dir);
  }, [scopedPeople, q, mahalla, status, ages, onlyNeet, onlySupport, onlyStale, sort, locked]);

  const th = (key: typeof sort.key, label: string) => (
    <th className="px-4 py-3 text-left font-medium">
      <button
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 1 ? -1 : 1 }))}
      >
        {label} <ArrowUpDown className="size-3" />
      </button>
    </th>
  );

  return (
    <div>
      <PageHeader title="Реестр молодёжи" subtitle={`Найдено записей: ${rows.length}`} />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по ФИО"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={locked ? session!.mahalla! : mahalla} onValueChange={setMahalla} disabled={locked}>
            <SelectTrigger>
              <SelectValue placeholder="Махалля" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все махалли</SelectItem>
              {MAHALLAS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="px-1">
            <div className="mb-1 text-xs text-muted-foreground">
              Возраст: {ages[0]}–{ages[1]} лет
            </div>
            <Slider min={18} max={30} step={1} value={ages} onValueChange={setAges} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 border-t border-border pt-4 text-sm">
          <Toggle label="только NEET" checked={onlyNeet} onChange={setOnlyNeet} />
          <Toggle label="нужна поддержка" checked={onlySupport} onChange={setOnlySupport} />
          <Toggle label="устаревшие данные" checked={onlyStale} onChange={setOnlyStale} />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {th("fullName", "ФИО")}
                {th("age", "Возраст")}
                {th("mahalla", "Махалля")}
                <th className="px-4 py-3 text-left font-medium">Статус</th>
                <th className="px-4 py-3 text-left font-medium">Деятельность</th>
                {th("lastUpdate", "Актуальность")}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 150).map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate({ to: "/person/$id", params: { id: p.id } })}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.fullName}</span>
                      {p.neet && <NeetBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.age}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.mahalla}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status as EmploymentStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.activity}</td>
                  <td className="px-4 py-3">
                    <FreshnessDot person={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState text="По заданным фильтрам записи не найдены." />}
        {rows.length > 150 && (
          <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
            Показаны первые 150 записей из {rows.length}. Уточните фильтры.
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      {label}
    </label>
  );
}
