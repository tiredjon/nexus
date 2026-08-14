import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  GraduationCap,
  Briefcase,
  Store,
  BookOpen,
  Dot,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PROGRAMS, formatDate, daysAgo, type Person, type Program } from "@/lib/data";
import { EmptyState, NeetBadge, StatusBadge } from "@/components/common";
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

export const Route = createFileRoute("/person/$id")({
  head: () => ({
    meta: [
      { title: "Профиль молодого человека — Yoshlar Radar" },
      {
        name: "description",
        content: "Карточка профиля: история статусов и рекомендуемые направления поддержки.",
      },
      { property: "og:title", content: "Профиль — Yoshlar Radar" },
      { property: "og:description", content: "История статусов и маршрутизация на программы." },
    ],
  }),
  component: PersonPage,
});

type Suggestion = { program: Program; reason: string; icon: React.ElementType };

function suggestions(p: Person): Suggestion[] {
  const list: Suggestion[] = [];
  const jobless = p.status === "Безработный" || p.status === "Статус не уточнён";
  if (jobless && !p.hasProfession)
    list.push({
      program: "Профессиональное обучение",
      reason: "Безработный, профессия не указана — требуется базовая профподготовка.",
      icon: GraduationCap,
    });
  if (jobless && p.hasProfession)
    list.push({
      program: "Содействие в трудоустройстве",
      reason: "Безработный, но есть профессиональные навыки — подбор вакансии и сопровождение.",
      icon: Briefcase,
    });
  if (p.businessInterest)
    list.push({
      program: "Программа поддержки бизнеса",
      reason: "Отмечен интерес к предпринимательству — субсидии и бизнес-наставничество.",
      icon: Store,
    });
  if (p.droppedStudies)
    list.push({
      program: "Возвращение к обучению",
      reason: "Обучение не завершено — восстановление в колледже или вузе.",
      icon: BookOpen,
    });
  if (list.length === 0)
    list.push({
      program: "Молодёжная стажировка",
      reason: "Устойчивый статус, но возможна поддержка карьерного роста через стажировку.",
      icon: Briefcase,
    });
  return list;
}

function PersonPage() {
  const { id } = Route.useParams();
  const { scopedPeople, routeToProgram, confirmStatus, requestClarification } = useStore();
  const person = scopedPeople.find((p) => p.id === id);

  const [open, setOpen] = useState(false);
  const [program, setProgram] = useState<Program>(PROGRAMS[0]);
  const [comment, setComment] = useState("");

  if (!person)
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState text="Профиль не найден или недоступен в рамках вашей территории." />
        <div className="mt-4 text-center">
          <Link to="/registry" className="text-sm text-primary hover:underline">
            Вернуться в реестр
          </Link>
        </div>
      </div>
    );

  const history = [...person.history].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <Link
        to="/registry"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К реестру
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{person.fullName}</h1>
              <StatusBadge status={person.status} />
              {person.neet && <NeetBadge />}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {person.age} лет · {person.gender} · махалля {person.mahalla} · ID {person.id}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Деятельность: {person.activity} · обновлено {formatDate(person.lastUpdate)} (
              {daysAgo(person.lastUpdate)} дн. назад)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                confirmStatus(person.id);
                toast.success("Статус подтверждён", { description: "Событие добавлено в историю." });
              }}
            >
              <CheckCircle2 className="size-4" /> Подтвердить статус (проверено)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                requestClarification(person.id);
                toast("Запрошено уточнение", { description: "Дело переведено в статус «На уточнении»." });
              }}
            >
              <CircleHelp className="size-4" /> Запросить уточнение
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">История статусов</h2>
          <ol className="mt-5 space-y-0">
            {history.map((e, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="mt-1 flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Dot className="size-5" />
                  </span>
                  {i < history.length - 1 && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-1">
                  <div className="text-xs text-muted-foreground">{formatDate(e.date)}</div>
                  <div className="text-sm font-medium">{e.title}</div>
                  {e.note && <div className="mt-0.5 text-xs text-muted-foreground">{e.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Рекомендуемые направления поддержки</h2>
          <div className="mt-4 space-y-3">
            {suggestions(person).map((s) => (
              <div key={s.program} className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{s.program}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Основание: {s.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setProgram(s.program);
                      setOpen(true);
                    }}
                  >
                    Направить
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {person.program && (
            <p className="mt-4 rounded-lg bg-success/10 p-3 text-xs text-success">
              Уже направлен на программу: {person.program}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Рекомендации носят справочный характер. Решение принимает уполномоченный сотрудник.
          </p>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Направление на программу поддержки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Программа</label>
              <Select value={program} onValueChange={(v) => setProgram(v as Program)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Комментарий сотрудника</label>
              <Textarea
                className="mt-1.5"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Например: согласовано с инспектором махалли, начало обучения с сентября"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                routeToProgram(person.id, program, comment);
                setOpen(false);
                setComment("");
                toast.success("Направление оформлено", {
                  description: `${person.fullName} → ${program}`,
                });
              }}
            >
              Подтвердить направление
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
