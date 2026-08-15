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
  Pencil,
} from "lucide-react";
import { useStore, useRoleConfig } from "@/lib/store";
import { PROGRAMS, formatDate, daysAgo, formatWorkExperience, displayMaritalStatus, type Person, type Program } from "@/lib/data";
import { EmptyState, NeetBadge, StatusBadge } from "@/components/common";
import { EditPersonDialog, type AiPrefill } from "@/components/EditPersonDialog";
import { FieldNoteSection } from "@/components/FieldNoteSection";
import { RecommendationReason } from "@/components/RecommendationReason";
import { Badge } from "@/components/ui/badge";
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

type Suggestion = { program: Program; reason: string; icon: React.ElementType; priority: number };

function socialSuffix(p: Person) {
  if (p.familyInTemirDaftar || p.isBreadwinner) {
    return "; семья в социальном реестре — приоритет мерам с быстрым выходом на доход";
  }
  return "";
}

function suggestions(p: Person): Omit<Suggestion, "priority">[] {
  const jobless = p.status === "Безработный" || p.status === "Статус не уточнён";
  const list: Suggestion[] = [];

  if (p.graduationYear === null && p.status !== "Учится") {
    list.push({
      priority: 10,
      program: "Возвращение к обучению",
      reason: `Образование не завершено (${p.educationLevel})${socialSuffix(p)}`,
      icon: BookOpen,
    });
  }

  if (p.desiredDirection === "Предпринимательство") {
    list.push({
      priority: 20,
      program: "Программа поддержки бизнеса",
      reason: `Отмечен интерес к предпринимательству, состав семьи ${p.householdSize} чел.${socialSuffix(p)}`,
      icon: Store,
    });
  }

  if (jobless && p.skills.length === 0 && p.workExperienceMonths === 0) {
    list.push({
      priority: 30,
      program: "Профессиональное обучение",
      reason: `${p.age} лет, ${p.educationLevel}, опыта нет — требуется базовая профподготовка${socialSuffix(p)}`,
      icon: GraduationCap,
    });
  }

  if (jobless && p.skills.length > 0) {
    list.push({
      priority: 40,
      program: "Содействие в трудоустройстве",
      reason: `Есть навыки: ${p.skills.join(", ")}. Опыт ${formatWorkExperience(p.workExperienceMonths)} — подходит прямое трудоустройство${socialSuffix(p)}`,
      icon: Briefcase,
    });
  }

  if (list.length === 0) {
    list.push({
      priority: 100,
      program: "Молодёжная стажировка",
      reason: `Устойчивый статус; возможна поддержка карьерного роста${socialSuffix(p)}`,
      icon: Briefcase,
    });
  }

  const seen = new Set<Program>();
  return list
    .sort((a, b) => a.priority - b.priority)
    .filter((s) => {
      if (seen.has(s.program)) return false;
      seen.add(s.program);
      return true;
    })
    .map(({ priority: _, ...rest }) => rest);
}

function PersonPage() {
  const { id } = Route.useParams();
  const { scopedPeople, session, routeToProgram, confirmStatus, requestClarification } = useStore();
  const roleConfig = useRoleConfig();
  const person = scopedPeople.find((p) => p.id === id);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [aiPrefill, setAiPrefill] = useState<AiPrefill | null>(null);
  const [program, setProgram] = useState<Program>(PROGRAMS[0]);
  const [comment, setComment] = useState("");

  const canParseNote =
    session &&
    (session.role === "mahalla_officer" ||
      session.role === "youth_rep" ||
      session.role === "admin");

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
          {(roleConfig?.can.confirmStatus ||
            roleConfig?.can.requestClarification ||
            roleConfig?.can.editProfile) && (
            <div className="flex flex-wrap gap-2">
              {roleConfig?.can.editProfile && (
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" /> Редактировать
                </Button>
              )}
              {roleConfig?.can.confirmStatus && (
                <Button
                  variant="outline"
                  onClick={() => {
                    confirmStatus(person.id);
                    toast.success("Статус подтверждён", {
                      description: "Событие добавлено в историю.",
                    });
                  }}
                >
                  <CheckCircle2 className="size-4" /> Подтвердить статус (проверено)
                </Button>
              )}
              {roleConfig?.can.requestClarification && (
                <Button
                  variant="outline"
                  onClick={() => {
                    requestClarification(person.id);
                    toast("Запрошено уточнение", {
                      description: "Дело переведено в статус «На уточнении».",
                    });
                  }}
                >
                  <CircleHelp className="size-4" /> Запросить уточнение
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mt-4">
        <h2 className="mb-3 text-sm font-semibold">Сведения о человеке</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="Личные данные">
            <InfoLine label="Дата рождения" value={formatDate(person.birthDate)} />
            <InfoLine label="Пол" value={person.gender} />
            <InfoLine label="Махалля" value={person.mahalla} />
            <InfoLine label="Условная зона" value={person.streetBlock} />
            <InfoLine label="Состав семьи" value={`${person.householdSize} чел.`} />
            <InfoLine label="Семейное положение" value={displayMaritalStatus(person)} />
            {person.isBreadwinner && (
              <InfoLine label="Единственный кормилец" value="да" />
            )}
          </InfoCard>

          <InfoCard title="Образование и навыки">
            <InfoLine label="Уровень образования" value={person.educationLevel} />
            <InfoLine label="Учебное заведение" value={person.educationInstitution} />
            <InfoLine label="Специальность" value={person.specialty} />
            {person.graduationYear != null && (
              <InfoLine label="Год окончания" value={String(person.graduationYear)} />
            )}
            {person.skills.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground">Навыки</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {person.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {person.languages.length > 0 && (
              <InfoLine label="Языки" value={person.languages.join(", ")} />
            )}
            {person.hasDriverLicense && (
              <InfoLine label="Водительские права" value="есть" />
            )}
          </InfoCard>

          <InfoCard title="Занятость">
            <InfoLine label="Текущий статус" value={person.status} />
            <InfoLine label="Место работы/учёбы" value={person.activity !== "—" ? person.activity : null} />
            {(person.status === "Работает" || person.status === "Предприниматель") && (
              <InfoLine
                label="Официальное оформление"
                value={person.isFormalEmployment ? "да" : "нет"}
              />
            )}
            <InfoLine
              label="Опыт работы"
              value={
                person.workExperienceMonths > 0
                  ? formatWorkExperience(person.workExperienceMonths)
                  : null
              }
            />
            <InfoLine label="Желаемое направление" value={person.desiredDirection} />
          </InfoCard>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Источник последнего обновления: {person.lastUpdateSource} · Ответственный:{" "}
          {person.responsibleOfficer}
        </p>
      </section>

      {canParseNote && (
        <FieldNoteSection
          person={person}
          onApply={(prefill) => {
            setAiPrefill(prefill);
            setEditOpen(true);
          }}
        />
      )}

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
                    <RecommendationReason person={person} program={s.program} />
                  </div>
                  {roleConfig?.can.routeToProgram ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setProgram(s.program);
                        setOpen(true);
                      }}
                    >
                      Направить
                    </Button>
                  ) : (
                    <span className="max-w-28 text-right text-xs text-muted-foreground">
                      Направление выполняет представитель по работе с молодёжью
                    </span>
                  )}
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
            Программы подбираются по формальным правилам. ИИ формирует пояснение. Решение о
            направлении принимает уполномоченный сотрудник.
          </p>
        </section>
      </div>

      <EditPersonDialog
        person={person}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setAiPrefill(null);
        }}
        aiPrefill={aiPrefill}
      />

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

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span>{value}</span>
    </div>
  );
}
