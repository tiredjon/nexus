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
import { PROGRAMS, daysAgo, formatWorkExperience, type Person, type Program } from "@/lib/data";
import { useLanguage, useLabels } from "@/lib/i18n";
import { EmptyState, NeetBadge, StatusBadge } from "@/components/common";
import { EditPersonDialog, type AiPrefill } from "@/components/EditPersonDialog";
import { FieldNoteSection } from "@/components/FieldNoteSection";
import { OpportunityMatch } from "@/components/OpportunityMatch";
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

function PersonPage() {
  const { t } = useLanguage();
  const labels = useLabels();
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
        <EmptyState text={t("person.notFound")} />
        <div className="mt-4 text-center">
          <Link to="/registry" className="text-sm text-primary hover:underline">
            {t("common.backToRegistry")}
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
        <ArrowLeft className="size-4" /> {t("common.toRegistry")}
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
              {t("person.meta", {
                age: person.age,
                gender: labels.gender(person.gender),
                mahalla: person.mahalla,
                id: person.id,
              })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("person.activityLine", {
                activity: labels.activity(person.activity),
                date: labels.formatDate(person.lastUpdate),
                days: daysAgo(person.lastUpdate),
              })}
            </p>
          </div>
          {(roleConfig?.can.confirmStatus ||
            roleConfig?.can.requestClarification ||
            roleConfig?.can.editProfile) && (
            <div className="flex flex-wrap gap-2">
              {roleConfig?.can.editProfile && (
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" /> {t("person.edit")}
                </Button>
              )}
              {roleConfig?.can.confirmStatus && (
                <Button
                  variant="outline"
                  onClick={() => {
                    confirmStatus(person.id);
                    toast.success(t("toast.statusConfirmed"), {
                      description: t("toast.statusConfirmedDesc"),
                    });
                  }}
                >
                  <CheckCircle2 className="size-4" /> {t("person.confirmStatus")}
                </Button>
              )}
              {roleConfig?.can.requestClarification && (
                <Button
                  variant="outline"
                  onClick={() => {
                    requestClarification(person.id);
                    toast(t("toast.clarificationRequested"), {
                      description: t("toast.clarificationRequestedDesc"),
                    });
                  }}
                >
                  <CircleHelp className="size-4" /> {t("person.requestClarification")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mt-4">
        <h2 className="mb-3 text-sm font-semibold">{t("person.section.person")}</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title={t("person.section.personal")}>
            <InfoLine label={t("person.field.birthDate")} value={labels.formatDate(person.birthDate)} />
            <InfoLine label={t("person.field.gender")} value={labels.gender(person.gender)} />
            <InfoLine label={t("person.field.mahalla")} value={person.mahalla} />
            <InfoLine label={t("person.field.zone")} value={person.streetBlock} />
            <InfoLine
              label={t("person.field.familySize")}
              value={t("common.peopleCount", { count: person.householdSize })}
            />
            <InfoLine label={t("person.field.marital")} value={labels.marital(person)} />
            {person.isBreadwinner && (
              <InfoLine label={t("person.field.breadwinner")} value={t("common.yes")} />
            )}
          </InfoCard>

          <InfoCard title={t("person.section.education")}>
            <InfoLine
              label={t("person.field.education")}
              value={labels.education(person.educationLevel)}
            />
            <InfoLine label={t("person.field.institution")} value={person.educationInstitution} />
            <InfoLine label={t("person.field.specialty")} value={person.specialty} />
            {person.graduationYear != null && (
              <InfoLine label={t("person.field.gradYear")} value={String(person.graduationYear)} />
            )}
            {person.skills.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground">{t("person.field.skills")}</div>
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
              <InfoLine label={t("person.field.languages")} value={person.languages.join(", ")} />
            )}
            {person.hasDriverLicense && (
              <InfoLine label={t("person.field.drivers")} value={t("common.has")} />
            )}
          </InfoCard>

          <InfoCard title={t("person.section.employment")}>
            <InfoLine
              label={t("person.field.currentStatus")}
              value={labels.status(person.status)}
            />
            <InfoLine
              label={t("person.field.workplace")}
              value={person.activity !== "—" ? labels.activity(person.activity) : null}
            />
            {(person.status === "Работает" || person.status === "Предприниматель") && (
              <InfoLine
                label={t("person.field.official")}
                value={person.isFormalEmployment ? t("common.yes") : t("common.no")}
              />
            )}
            <InfoLine
              label={t("person.field.experience")}
              value={
                person.workExperienceMonths > 0
                  ? labels.formatExperience(person.workExperienceMonths)
                  : null
              }
            />
            <InfoLine
              label={t("person.field.desired")}
              value={labels.direction(person.desiredDirection)}
            />
          </InfoCard>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("person.source")} {labels.source(person.lastUpdateSource)} · {t("person.responsible")}{" "}
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
          <h2 className="text-sm font-semibold">{t("person.section.history")}</h2>
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
                  <div className="text-xs text-muted-foreground">{labels.formatDate(e.date)}</div>
                  <div className="text-sm font-medium">{labels.historyTitle(e.title)}</div>
                  {e.note && <div className="mt-0.5 text-xs text-muted-foreground">{e.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <OpportunityMatch person={person} />
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
            <DialogTitle>{t("person.routeDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("person.routeDialog.program")}</label>
              <Select value={program} onValueChange={(v) => setProgram(v as Program)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {labels.program(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("person.routeDialog.comment")}</label>
              <Textarea
                className="mt-1.5"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("person.routeDialog.placeholderLong")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancelAlt")}
            </Button>
            <Button
              onClick={() => {
                routeToProgram(person.id, program, comment);
                setOpen(false);
                setComment("");
                toast.success(t("toast.routed"), {
                  description: t("toast.routedDesc", {
                    name: person.fullName,
                    program: labels.program(program),
                  }),
                });
              }}
            >
              {t("person.routeDialog.confirm")}
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
