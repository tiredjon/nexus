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
  type Person,
  type UpdateSource,
} from "@/lib/data";
import { type PersonEditableFields, useStore } from "@/lib/store";
import { useLanguage, useLabels } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/ru";
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

const FIELD_LABEL_KEYS: Record<keyof EditableFormState, TranslationKey> = {
  status: "edit.field.status",
  activity: "edit.field.activity",
  isFormalEmployment: "edit.field.isFormalEmployment",
  workExperienceMonths: "edit.field.workExperienceMonths",
  educationLevel: "edit.field.educationLevel",
  educationInstitution: "edit.field.educationInstitution",
  specialty: "edit.field.specialty",
  skills: "edit.field.skills",
  languages: "edit.field.languages",
  hasDriverLicense: "edit.field.hasDriverLicense",
  desiredDirection: "edit.field.desiredDirection",
  householdSize: "edit.field.householdSize",
  maritalStatus: "edit.field.maritalStatus",
  isBreadwinner: "edit.field.isBreadwinner",
  streetBlock: "edit.field.streetBlock",
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

function getChangedLabels(
  before: EditableFormState,
  after: EditableFormState,
  t: (key: TranslationKey) => string,
): string[] {
  const labels: string[] = [];
  (Object.keys(FIELD_LABEL_KEYS) as (keyof EditableFormState)[]).forEach((key) => {
    const prev = before[key];
    const next = after[key];
    if (Array.isArray(prev) && Array.isArray(next)) {
      if (!arraysEqual(prev, next)) labels.push(t(FIELD_LABEL_KEYS[key]));
    } else if (prev !== next) {
      labels.push(t(FIELD_LABEL_KEYS[key]));
    }
  });
  return labels;
}

function buildChanges(
  before: EditableFormState,
  after: EditableFormState,
): Partial<PersonEditableFields> {
  const changes: Partial<PersonEditableFields> = {};
  (Object.keys(FIELD_LABEL_KEYS) as (keyof EditableFormState)[]).forEach((key) => {
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
  const { t } = useLanguage();
  const labels = useLabels();
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

  const changedLabels = useMemo(
    () => getChangedLabels(toFormState(person), form, t),
    [person, form, t],
  );
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
    toast.success(t("toast.dataUpdated"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold">{t("edit.registryData")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ReadOnlyField label={t("edit.fullName")} value={person.fullName} />
              <ReadOnlyField label={t("person.field.birthDate")} value={labels.formatDate(person.birthDate)} />
              <ReadOnlyField label={t("person.field.gender")} value={labels.gender(person.gender)} />
              <ReadOnlyField label={t("person.field.mahalla")} value={person.mahalla} />
              <ReadOnlyField
                label={t("edit.yoshlar")}
                value={person.inYoshlarDaftari ? t("common.yes") : t("common.no")}
              />
              <ReadOnlyField
                label={t("edit.ayollar")}
                value={person.inAyollarDaftari ? t("common.yes") : t("common.no")}
              />
              <ReadOnlyField
                label={t("edit.temir")}
                value={person.familyInTemirDaftar ? t("common.yes") : t("common.no")}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("edit.registryNote")}</p>
          </section>

          <section className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold">{t("edit.editableData")}</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label={t("create.employmentStatus")} highlighted={isHighlighted("status")}>
                <Select value={form.status} onValueChange={(v) => set("status", v as Person["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.filter((s) => s !== "Направлен на программу").map((s) => (
                      <SelectItem key={s} value={s}>
                        {labels.status(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("create.workplace")} highlighted={isHighlighted("activity")}>
                <Input value={form.activity} onChange={(e) => set("activity", e.target.value)} />
              </Field>

              <Field label={t("create.official")} highlighted={isHighlighted("isFormalEmployment")}>
                <div className="flex h-10 items-center gap-2">
                  <Switch
                    checked={form.isFormalEmployment}
                    onCheckedChange={(v) => set("isFormalEmployment", v)}
                  />
                  <span className="text-sm">
                    {form.isFormalEmployment ? t("common.yes") : t("common.no")}
                  </span>
                </div>
              </Field>

              <Field label={t("create.experienceMonths")} highlighted={isHighlighted("workExperienceMonths")}>
                <Input
                  type="number"
                  min={0}
                  value={form.workExperienceMonths}
                  onChange={(e) => set("workExperienceMonths", Number(e.target.value) || 0)}
                />
              </Field>

              <Field label={t("create.educationLevel")} highlighted={isHighlighted("educationLevel")}>
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
                        {labels.education(l)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("create.institution")} highlighted={isHighlighted("educationInstitution")}>
                <Input
                  value={form.educationInstitution}
                  onChange={(e) => set("educationInstitution", e.target.value)}
                />
              </Field>

              <Field label={t("create.specialty")} highlighted={isHighlighted("specialty")}>
                <Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
              </Field>

              <Field label={t("create.desiredDirection")} highlighted={isHighlighted("desiredDirection")}>
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
                        {labels.direction(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("create.familySize")} highlighted={isHighlighted("householdSize")}>
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

              <Field label={t("create.marital")} highlighted={isHighlighted("maritalStatus")}>
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
                        {labels.maritalCombined(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("create.zone")} highlighted={isHighlighted("streetBlock")}>
                <Input value={form.streetBlock} onChange={(e) => set("streetBlock", e.target.value)} />
              </Field>

              <Field label={t("person.field.breadwinner")} highlighted={isHighlighted("isBreadwinner")}>
                <div className="flex h-10 items-center gap-2">
                  <Switch checked={form.isBreadwinner} onCheckedChange={(v) => set("isBreadwinner", v)} />
                  <span className="text-sm">
                    {form.isBreadwinner ? t("common.yes") : t("common.no")}
                  </span>
                </div>
              </Field>

              <Field label={t("person.field.drivers")} highlighted={isHighlighted("hasDriverLicense")}>
                <div className="flex h-10 items-center gap-2">
                  <Switch
                    checked={form.hasDriverLicense}
                    onCheckedChange={(v) => set("hasDriverLicense", v)}
                  />
                  <span className="text-sm">
                    {form.hasDriverLicense ? t("common.yes") : t("common.no")}
                  </span>
                </div>
              </Field>

              <div className={cn("sm:col-span-2", isHighlighted("skills") && "rounded-lg bg-[#eff6ff] p-2")}>
                <Field label={t("create.skills")}>
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
                      placeholder={t("create.addSkill")}
                    />
                    <Button type="button" variant="outline" onClick={addSkill}>
                      {t("create.add")}
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
                <Field label={t("person.field.languages")}>
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

          <Field label={t("edit.changeBasis")}>
            <Select value={source} onValueChange={(v) => setSource(v as UpdateSource)}>
              <SelectTrigger>
                <SelectValue placeholder={t("create.selectBasis")} />
              </SelectTrigger>
              <SelectContent>
                {EDIT_UPDATE_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {labels.source(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!canSave} onClick={save}>
            {t("edit.saveChanges")}
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
