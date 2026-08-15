import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Info, Search } from "lucide-react";
import { useStore, useRoleConfig } from "@/lib/store";
import { MAHALLAS, REVIEW_STATUSES, STATUSES, daysAgo, isStale, shortName, type ReviewStatus } from "@/lib/data";
import { computePriorityLevel, compareByPriority, type PriorityLevel } from "@/lib/person-compute";
import { isOwnMahallaScope } from "@/lib/permissions";
import { useLanguage, useLabels } from "@/lib/i18n";
import { EmptyState, PageHeader, PriorityBadge, StatusBadge, YR_CARD, YR_CARD_INTERACTIVE } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Требуют внимания — Yoshlar Radar" },
      {
        name: "description",
        content: "Очередь проверки флагов NEET: канбан-доска по стадиям верификации.",
      },
      { property: "og:title", content: "Требуют внимания — Yoshlar Radar" },
      { property: "og:description", content: "Очередь проверки флагов NEET по махаллям района." },
    ],
  }),
  component: Review,
});

const COLUMN_TONE: Record<ReviewStatus, string> = {
  "Ожидает проверки": "bg-warning",
  "На уточнении": "bg-primary",
  Подтверждено: "bg-danger",
  "Флаг снят": "bg-success",
};

const DEFAULT_AGES: [number, number] = [18, 30];

function Review() {
  const { t } = useLanguage();
  const labels = useLabels();
  const { scopedPeople, session, setReviewStatus } = useStore();
  const roleConfig = useRoleConfig();
  const canMove = roleConfig?.can.moveKanban ?? false;
  const locked = session ? isOwnMahallaScope(session.role) : false;

  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ReviewStatus | null>(null);
  const [q, setQ] = useState("");
  const [mahalla, setMahalla] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [ages, setAges] = useState<number[]>([...DEFAULT_AGES]);
  const [overdue30, setOverdue30] = useState(false);
  const [onlyStale, setOnlyStale] = useState(false);
  const [socialRegistry, setSocialRegistry] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const baseCases = scopedPeople.filter((p) => p.neet || p.neetReviewStatus !== "Флаг снят");

  const filteredCases = useMemo(() => {
    const [minA, maxA] = [ages[0] ?? 18, ages[1] ?? 30];
    return baseCases
      .filter((p) => p.fullName.toLowerCase().includes(q.trim().toLowerCase()))
      .filter((p) => (locked || mahalla === "all" ? true : p.mahalla === mahalla))
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) => p.age >= minA && p.age <= maxA)
      .filter((p) => (overdue30 ? daysAgo(p.lastUpdate) > 30 : true))
      .filter((p) => (onlyStale ? isStale(p) : true))
      .filter((p) =>
        socialRegistry
          ? p.inYoshlarDaftari || p.inAyollarDaftari || p.familyInTemirDaftar
          : true,
      )
      .filter((p) =>
        priorityFilter === "all" ? true : computePriorityLevel(p) === priorityFilter,
      );
  }, [baseCases, q, mahalla, status, ages, overdue30, onlyStale, socialRegistry, priorityFilter, locked]);

  const hasActiveFilters =
    q.trim().length > 0 ||
    (!locked && mahalla !== "all") ||
    status !== "all" ||
    ages[0] !== DEFAULT_AGES[0] ||
    ages[1] !== DEFAULT_AGES[1] ||
    overdue30 ||
    onlyStale ||
    socialRegistry ||
    priorityFilter !== "all";

  const resetFilters = () => {
    setQ("");
    setMahalla("all");
    setStatus("all");
    setAges([...DEFAULT_AGES]);
    setOverdue30(false);
    setOnlyStale(false);
    setSocialRegistry(false);
    setPriorityFilter("all");
  };

  return (
    <div>
      <PageHeader
        title={t("review.title")}
        subtitle={t("review.inProgress", { count: filteredCases.length })}
      />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" />
        <p>{t("review.neetBanner")}</p>
      </div>

      <div className="mb-5 yr-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("registry.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={locked ? session!.mahalla! : mahalla}
            onValueChange={setMahalla}
            disabled={locked}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("registry.mahalla")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("registry.allMahallas")}</SelectItem>
              {MAHALLAS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t("registry.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("registry.allStatuses")}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {labels.status(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("review.priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(["Высокий", "Средний", "Обычный"] as PriorityLevel[]).map((level) => (
                <SelectItem key={level} value={level}>
                  {labels.priority(level)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="px-1 md:col-span-2 xl:col-span-1">
            <div className="mb-1 text-xs text-muted-foreground">
              {t("registry.ageRange", { min: ages[0] ?? 18, max: ages[1] ?? 30 })}
            </div>
            <Slider min={18} max={30} step={1} value={ages} onValueChange={setAges} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap gap-5">
            <Toggle label={t("review.overdue30")} checked={overdue30} onChange={setOverdue30} />
            <Toggle label={t("registry.staleData")} checked={onlyStale} onChange={setOnlyStale} />
            <Toggle
              label={t("review.socialRegistry")}
              checked={socialRegistry}
              onChange={setSocialRegistry}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              {t("common.reset")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {REVIEW_STATUSES.map((col) => {
          const items = filteredCases
            .filter((p) => p.neetReviewStatus === col)
            .sort(compareByPriority);
          return (
            <div
              key={col}
              onDragOver={
                canMove
                  ? (e) => {
                      e.preventDefault();
                      setOver(col);
                    }
                  : undefined
              }
              onDragLeave={canMove ? () => setOver((o) => (o === col ? null : o)) : undefined}
              onDrop={
                canMove
                  ? () => {
                      if (dragId) {
                        const person = filteredCases.find((p) => p.id === dragId);
                        setReviewStatus(dragId, col);
                        toast.success(t("toast.movedTo", { column: labels.review(col) }), {
                          description: person?.fullName,
                        });
                      }
                      setDragId(null);
                      setOver(null);
                    }
                  : undefined
              }
              className={cn(
                "yr-card max-h-[calc(100vh-16rem)] bg-muted/30 p-3 transition-colors duration-150",
                over === col ? "border-primary bg-primary/5" : "",
              )}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("size-2 rounded-full", COLUMN_TONE[col])} />
                <h2 className="text-sm font-semibold">{labels.review(col)}</h2>
                <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <div className="yr-scrollbar yr-stagger max-h-[min(520px,calc(100vh-20rem))] space-y-2 overflow-y-auto pr-1">
                {items.length === 0 && <EmptyState text={t("review.emptyColumn")} />}
                {items.slice(0, 40).map((p) => (
                  <article
                    key={p.id}
                    draggable={canMove}
                    onDragStart={canMove ? () => setDragId(p.id) : undefined}
                    onDragEnd={canMove ? () => setDragId(null) : undefined}
                    className={cn(
                      YR_CARD_INTERACTIVE + " p-3",
                      canMove && "cursor-grab active:cursor-grabbing",
                      dragId === p.id && "opacity-50",
                    )}
                  >
                    <div className="text-sm font-medium">{shortName(p)}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t("common.yearsOld", { age: p.age })} · {p.mahalla}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <PriorityBadge person={p} />
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("common.daysAgo", { days: daysAgo(p.lastUpdate) })}
                      </span>
                    </div>
                    <Link
                      to="/person/$id"
                      params={{ id: p.id }}
                      className="mt-2 inline-block text-xs font-medium text-primary transition-colors duration-150 hover:underline"
                    >
                      {t("review.openProfile")}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
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
