import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import {
  DESIRED_DIRECTIONS,
  EDIT_UPDATE_SOURCES,
  EDUCATION_LEVELS,
  LANGUAGE_POOL,
  MARITAL_STATUSES,
  STATUSES,
  formatDate,
  type Person,
  type UpdateSource,
} from "@/lib/data";
import { type PersonEditableFields, useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type EditableFormState = Omit<PersonEditableFields, "educationInstitution" | "specialty"> & {
  educationInstitution: string;
  specialty: string;
};

export type { EditableFormState };

export type AiPrefill = {
  form: Partial<EditableFormState>;
  highlightedFields: (keyof EditableFormState)[];
  defaultSource?: UpdateSource;
  historyTitle?: string;
};

const FIELD_LABELS: Record<keyof EditableFormState, string> = {
  status: "статус занятости",
  activity: "место работы/учёбы",
  isFormalEmployment: "официальное оформление",
  workExperienceMonths: "опыт работы",
  educationLevel: "уровень образования",
  educationInstitution: "учебное заведение",
  specialty: "специальность",
  skills: "навыки",
  languages: "языки",
  hasDriverLicense: "водительские права",
  desiredDirection: "желаемое направление",
  householdSize: "состав семьи",
  maritalStatus: "семейное положение",
  isBreadwinner: "единственный кормилец",
  streetBlock: "условная зона",
};

function toFormState(person: Person): EditableFormState {
  return {
    status: person.status,
    activity: person.activity === "—" ? "" : person.activity,
    isFormalEmployment: person.isFormalEmployment,
    workExperienceMonths: person.workExperienceMonths,
    educationLevel: person.educationLevel,
    educationInstitution: person.educationInstitution ?? "",
    specialty: person.specialty ?? "",
    skills: [...person.skills],
    languages: [...person.languages],
    hasDriverLicense: person.hasDriverLicense,
    desiredDirection: person.desiredDirection,
    householdSize: person.householdSize,
    maritalStatus: person.maritalStatus,
    isBreadwinner: person.isBreadwinner,
    streetBlock: person.streetBlock === "—" ? "" : person.streetBlock,
  };
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function getChangedLabels(before: EditableFormState, after: EditableFormState): string[] {
  const labels: string[] = [];
  (Object.keys(FIELD_LABELS) as (keyof EditableFormState)[]).forEach((key) => {
    const prev = before[key];
    const next = after[key];
    if (Array.isArray(prev) && Array.isArray(next)) {
      if (!arraysEqual(prev, next)) labels.push(FIELD_LABELS[key]);
    } else if (prev !== next) {
      labels.push(FIELD_LABELS[key]);
    }
  });
  return labels;
}

function buildChanges(
  before: EditableFormState,
  after: EditableFormState,
): Partial<PersonEditableFields> {
  const changes: Partial<PersonEditableFields> = {};
  (Object.keys(FIELD_LABELS) as (keyof EditableFormState)[]).forEach((key) => {
    const prev = before[key];
    const next = after[key];
    if (Array.isArray(prev) && Array.isArray(next)) {
      if (!arraysEqual(prev, next)) (changes as Record<string, unknown>)[key] = next;
    } else if (prev !== next) {
      (changes as Record<string, unknown>)[key] = next;
    }
  });
  return changes;
}

export function EditPersonDialog({
  person,
  open,
  onOpenChange,
  aiPrefill,
}: {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiPrefill?: AiPrefill | null;
}) {
  const { updatePerson } = useStore();
  const [form, setForm] = useState<EditableFormState>(() => toFormState(person));
  const [source, setSource] = useState<UpdateSource | "">("");
  const [skillInput, setSkillInput] = useState("");
  const [activePrefill, setActivePrefill] = useState<AiPrefill | null>(null);

  useEffect(() => {
    if (open) {
      const base = toFormState(person);
      if (aiPrefill) {
        setForm({ ...base, ...aiPrefill.form });
        setSource(aiPrefill.defaultSource ?? "");
        setActivePrefill(aiPrefill);
      } else {
        setForm(base);
        setSource("");
        setActivePrefill(null);
      }
      setSkillInput("");
    }
  }, [open, person, aiPrefill]);

  const changedLabels = useMemo(() => getChangedLabels(toFormState(person), form), [person, form]);
  const hasChanges = changedLabels.length > 0;
  const canSave = hasChanges && source !== "";

  const isHighlighted = (key: keyof EditableFormState) =>
    activePrefill?.highlightedFields.includes(key) ?? false;

  const set = <K extends keyof EditableFormState>(key: K, value: EditableFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    set("skills", [...form.skills, trimmed]);
    setSkillInput("");
  };

  const save = () => {
    if (!canSave || !source) return;
    const changes = buildChanges(toFormState(person), form);
    updatePerson(
      person.id,
      {
        ...changes,
        educationInstitution: form.educationInstitution || null,
        specialty: form.specialty || null,
        activity: form.activity || "—",
        streetBlock: form.streetBlock || "—",
      },
      source,
      changedLabels,
      activePrefill?.historyTitle ? { historyTitle: activePrefill.historyTitle } : undefined,
    );
    onOpenChange(false);
    toast.success("Данные обновлены");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование сведений</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold">Данные из реестров</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ReadOnlyField label="ФИО" value={person.fullName} />
              <ReadOnlyField label="Дата рождения" value={formatDate(person.birthDate)} />
              <ReadOnlyField label="Пол" value={person.gender} />
              <ReadOnlyField label="Махалля" value={person.mahalla} />
              <ReadOnlyField
                label="Ёшлар дафтари"
                value={person.inYoshlarDaftari ? "да" : "нет"}
              />
              <ReadOnlyField
                label="Аёллар дафтари"
                value={person.inAyollarDaftari ? "да" : "нет"}
              />
              <ReadOnlyField
                label="Темир дафтар"
                value={person.familyInTemirDaftar ? "да" : "нет"}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Изменяются только через синхронизацию с государственными реестрами
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold">Данные, уточняемые сотрудником</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Статус занятости" highlighted={isHighlighted("status")}>
                <Select value={form.status} onValueChange={(v) => set("status", v as Person["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.filter((s) => s !== "Направлен на программу").map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Место работы / учёбы" highlighted={isHighlighted("activity")}>
                <Input value={form.activity} onChange={(e) => set("activity", e.target.value)} />
              </Field>

              <Field label="Официальное оформление" highlighted={isHighlighted("isFormalEmployment")}>
                <div className="flex h-10 items-center gap-2">
                  <Switch
                    checked={form.isFormalEmployment}
                    onCheckedChange={(v) => set("isFormalEmployment", v)}
                  />
                  <span className="text-sm">{form.isFormalEmployment ? "да" : "нет"}</span>
                </div>
              </Field>

              <Field label="Опыт работы в месяцах" highlighted={isHighlighted("workExperienceMonths")}>
                <Input
                  type="number"
                  min={0}
                  value={form.workExperienceMonths}
                  onChange={(e) => set("workExperienceMonths", Number(e.target.value) || 0)}
                />
              </Field>

              <Field label="Уровень образования" highlighted={isHighlighted("educationLevel")}>
                <Select
                  value={form.educationLevel}
                  onValueChange={(v) => set("educationLevel", v as Person["educationLevel"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Учебное заведение" highlighted={isHighlighted("educationInstitution")}>
                <Input
                  value={form.educationInstitution}
                  onChange={(e) => set("educationInstitution", e.target.value)}
                />
              </Field>

              <Field label="Специальность" highlighted={isHighlighted("specialty")}>
                <Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
              </Field>

              <Field label="Желаемое направление" highlighted={isHighlighted("desiredDirection")}>
                <Select
                  value={form.desiredDirection}
                  onValueChange={(v) => set("desiredDirection", v as Person["desiredDirection"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIRED_DIRECTIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Состав семьи" highlighted={isHighlighted("householdSize")}>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.householdSize}
                  onChange={(e) =>
                    set("householdSize", Math.min(12, Math.max(1, Number(e.target.value) || 1)))
                  }
                />
              </Field>

              <Field label="Семейное положение" highlighted={isHighlighted("maritalStatus")}>
                <Select
                  value={form.maritalStatus}
                  onValueChange={(v) => set("maritalStatus", v as Person["maritalStatus"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Условная зона" highlighted={isHighlighted("streetBlock")}>
                <Input value={form.streetBlock} onChange={(e) => set("streetBlock", e.target.value)} />
              </Field>

              <Field label="Единственный кормилец" highlighted={isHighlighted("isBreadwinner")}>
                <div className="flex h-10 items-center gap-2">
                  <Switch checked={form.isBreadwinner} onCheckedChange={(v) => set("isBreadwinner", v)} />
                  <span className="text-sm">{form.isBreadwinner ? "да" : "нет"}</span>
                </div>
              </Field>

              <Field label="Водительские права" highlighted={isHighlighted("hasDriverLicense")}>
                <div className="flex h-10 items-center gap-2">
                  <Switch
                    checked={form.hasDriverLicense}
                    onCheckedChange={(v) => set("hasDriverLicense", v)}
                  />
                  <span className="text-sm">{form.hasDriverLicense ? "да" : "нет"}</span>
                </div>
              </Field>

              <div className={cn("sm:col-span-2", isHighlighted("skills") && "rounded-lg bg-[#eff6ff] p-2")}>
                <Field label="Навыки">
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Добавить навык"
                    />
                    <Button type="button" variant="outline" onClick={addSkill}>
                      Добавить
                    </Button>
                  </div>
                  {form.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1 font-normal">
                          {s}
                          <button
                            type="button"
                            className="ml-0.5 hover:text-foreground"
                            onClick={() => set("skills", form.skills.filter((x) => x !== s))}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              <div className={cn("sm:col-span-2", isHighlighted("languages") && "rounded-lg bg-[#eff6ff] p-2")}>
                <Field label="Языки">
                  <div className="flex flex-wrap gap-4">
                    {LANGUAGE_POOL.map((lang) => (
                      <label key={lang} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.languages.includes(lang)}
                          onCheckedChange={(checked) => {
                            set(
                              "languages",
                              checked
                                ? [...form.languages, lang]
                                : form.languages.filter((l) => l !== lang),
                            );
                          }}
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </section>

          <Field label="Основание изменения">
            <Select value={source} onValueChange={(v) => setSource(v as UpdateSource)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите основание" />
              </SelectTrigger>
              <SelectContent>
                {EDIT_UPDATE_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отменить
          </Button>
          <Button disabled={!canSave} onClick={save}>
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  highlighted,
}: {
  label: string;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={cn(highlighted && "rounded-lg bg-[#eff6ff] p-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5 flex h-10 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
        <Lock className="size-3.5 shrink-0 opacity-60" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
