import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Users, PlayCircle, CheckCircle2, Briefcase } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  MAHALLAS,
  PROGRAMS,
  PROGRAM_OUTCOMES,
  daysAgo,
  formatDate,
  type Person,
  type Program,
  type ProgramOutcome,
} from "@/lib/data";
import { EmptyState, PageHeader, YR_CARD, YR_CARD_INTERACTIVE } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Search = { program?: string; outcome?: string };

export const Route = createFileRoute("/programs")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const result: Search = {};
    if (typeof s["program"] === "string") result.program = s["program"];
    if (typeof s["outcome"] === "string") result.outcome = s["outcome"];
    return result;
  },
  head: () => ({
    meta: [
      { title: "Программы — Yoshlar Radar" },
      {
        name: "description",
        content: "Учёт молодёжи, направленной на программы поддержки, и фиксация исходов участия.",
      },
      { property: "og:title", content: "Программы — Yoshlar Radar" },
      { property: "og:description", content: "Направления на программы и исходы участия." },
    ],
  }),
  component: Programs,
});

type OutcomeConfirm = {
  person: Person;
  newOutcome: ProgramOutcome;
  comment: string;
};

function Programs() {
  const { scopedPeople, setProgramOutcome } = useStore();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [q, setQ] = useState("");
  const [program, setProgram] = useState<string>(search.program ?? "all");
  const [mahalla, setMahalla] = useState<string>("all");
  const [outcome, setOutcome] = useState<string>(search.outcome ?? "all");
  const [confirm, setConfirm] = useState<OutcomeConfirm | null>(null);

  const routed = scopedPeople.filter((p) => p.program != null);

  const total = routed.length;
  const started = routed.filter(
    (p) =>
      p.programOutcome === "Приступил" ||
      p.programOutcome === "Завершил" ||
      p.programOutcome === "Трудоустроен",
  ).length;
  const completed = routed.filter(
    (p) => p.programOutcome === "Завершил" || p.programOutcome === "Трудоустроен",
  ).length;
  const employed = routed.filter((p) => p.programOutcome === "Трудоустроен").length;

  const rows = useMemo(() => {
    return routed
      .filter((p) => p.fullName.toLowerCase().includes(q.trim().toLowerCase()))
      .filter((p) => (program === "all" ? true : p.program === program))
      .filter((p) => (mahalla === "all" ? true : p.mahalla === mahalla))
      .filter((p) => (outcome === "all" ? true : p.programOutcome === outcome))
      .sort((a, b) => (b.programRoutedAt ?? "").localeCompare(a.programRoutedAt ?? ""));
  }, [routed, q, program, mahalla, outcome]);

  const closeConfirm = () => setConfirm(null);

  const submitOutcome = () => {
    if (!confirm) return;
    setProgramOutcome(confirm.person.id, confirm.newOutcome, confirm.comment.trim() || undefined);
    toast.success("Исход зафиксирован");
    closeConfirm();
  };

  const resetFilters = () => {
    setQ("");
    setProgram("all");
    setMahalla("all");
    setOutcome("all");
  };

  return (
    <div>
      <PageHeader title="Программы" subtitle={`Направлено на программы: ${total}`} />

      <div className="yr-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Всего направлено" value={total} tone="primary" />
        <Kpi icon={PlayCircle} label="Приступили" value={started} tone="primary" />
        <Kpi icon={CheckCircle2} label="Завершили" value={completed} tone="success" />
        <Kpi icon={Briefcase} label="Трудоустроены" value={employed} tone="success" />
      </div>

      <div className={`mt-4 ${YR_CARD} p-4`}>
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

          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Программа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все программы</SelectItem>
              {PROGRAMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mahalla} onValueChange={setMahalla}>
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

          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger>
              <SelectValue placeholder="Исход" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все исходы</SelectItem>
              {PROGRAM_OUTCOMES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`mt-4 overflow-hidden ${YR_CARD}`}>
        <div className="yr-scrollbar overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ФИО</th>
                <th className="px-4 py-3 text-left font-medium">Возраст</th>
                <th className="px-4 py-3 text-left font-medium">Махалля</th>
                <th className="px-4 py-3 text-left font-medium">Программа</th>
                <th className="px-4 py-3 text-left font-medium">Дата направления</th>
                <th className="px-4 py-3 text-left font-medium">Дней с направления</th>
                <th className="px-4 py-3 text-left font-medium">Кто направил</th>
                <th className="px-4 py-3 text-left font-medium">Исход</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-medium text-primary transition-colors duration-150 hover:underline"
                      onClick={() => navigate({ to: "/person/$id", params: { id: p.id } })}
                    >
                      {p.fullName}
                    </button>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.age}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.mahalla}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.program}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.programRoutedAt ? formatDate(p.programRoutedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {p.programRoutedAt ? daysAgo(p.programRoutedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.routedBy ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={p.programOutcome ?? "Ожидает"}
                      onValueChange={(v) => {
                        const newOutcome = v as ProgramOutcome;
                        const current = p.programOutcome ?? "Ожидает";
                        if (newOutcome === current) return;
                        setConfirm({ person: p, newOutcome, comment: "" });
                      }}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAM_OUTCOMES.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total === 0 ? (
          <EmptyState text="Пока никто не направлен на программы поддержки" />
        ) : rows.length === 0 ? (
          <EmptyState
            text="По заданным фильтрам записи не найдены"
            actionLabel="Сбросить фильтры"
            onAction={resetFilters}
          />
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Исход фиксируется уполномоченным специалистом. Автоматическое изменение статуса не
        производится.
      </p>

      <Dialog open={!!confirm} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите фиксацию исхода</DialogTitle>
          </DialogHeader>
          {confirm && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {confirm.person.fullName}, {confirm.person.age} лет · махалля{" "}
                  {confirm.person.mahalla}
                </p>
                <p className="mt-1">Программа: {confirm.person.program}</p>
                <p>
                  Направлен:{" "}
                  {confirm.person.programRoutedAt
                    ? formatDate(confirm.person.programRoutedAt)
                    : "—"}
                </p>
              </div>

              <p className="text-lg font-semibold tracking-tight">
                {confirm.person.programOutcome ?? "Ожидает"} → {confirm.newOutcome}
              </p>

              {confirm.newOutcome === "Трудоустроен" && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  Статус человека будет изменён на «Работает», дата обновления данных станет
                  текущей.
                </div>
              )}

              {(confirm.newOutcome === "Не явился" || confirm.newOutcome === "Отказался") && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  Случай вернётся в работу представителя по молодёжи для повторного
                  рассмотрения.
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Комментарий (необязательно)</label>
                <Textarea
                  className="mt-1.5 min-h-[60px]"
                  value={confirm.comment}
                  onChange={(e) =>
                    setConfirm((c) => (c ? { ...c, comment: e.target.value } : c))
                  }
                  placeholder="Краткий комментарий к решению"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm}>
              Отменить
            </Button>
            <Button onClick={submitOutcome}>Подтвердить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
};

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: keyof typeof TONES;
}) {
  return (
    <div className={YR_CARD_INTERACTIVE + " p-5"}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
        </div>
        <span className={`flex size-9 items-center justify-center rounded-lg ${TONES[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}
