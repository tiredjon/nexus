import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CREATE_UPDATE_SOURCES,
  DESIRED_DIRECTIONS,
  EDUCATION_LEVELS,
  MAHALLAS,
  MARITAL_STATUSES,
  STATUSES,
  buildFullName,
  type Mahalla,
  type Person,
  type UpdateSource,
} from "@/lib/data";
import { isOwnMahallaScope } from "@/lib/permissions";
import { type CreatePersonInput, useStore } from "@/lib/store";
import { useLanguage, useLabels } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type FormState = {
  lastName: string;
  firstName: string;
  patronymic: string;
  gender: Person["gender"];
  birthDate: string;
  mahalla: Mahalla;
  streetBlock: string;
  educationLevel: Person["educationLevel"];
  educationInstitution: string;
  specialty: string;
  status: Person["status"];
  activity: string;
  isFormalEmployment: boolean;
  workExperienceMonths: number;
  skills: string[];
  desiredDirection: Person["desiredDirection"];
  householdSize: number;
  maritalStatus: Person["maritalStatus"];
  source: UpdateSource | "";
};

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function emptyForm(defaultMahalla: Mahalla): FormState {
  return {
    lastName: "",
    firstName: "",
    patronymic: "",
    gender: "Мужской",
    birthDate: "",
    mahalla: defaultMahalla,
    streetBlock: "",
    educationLevel: "Среднее",
    educationInstitution: "",
    specialty: "",
    status: "Статус не уточнён",
    activity: "",
    isFormalEmployment: false,
    workExperienceMonths: 0,
    skills: [],
    desiredDirection: "Не определился",
    householdSize: 3,
    maritalStatus: "Не женат/не замужем",
    source: "",
  };
}

export function CreateRecordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const labels = useLabels();
  const { people, session, createPerson } = useStore();
  const navigate = useNavigate();
  const locked = session ? isOwnMahallaScope(session.role) : false;
  const defaultMahalla = session?.mahalla ?? MAHALLAS[0];

  const [form, setForm] = useState<FormState>(() => emptyForm(defaultMahalla));
  const [skillInput, setSkillInput] = useState("");
  const [duplicate, setDuplicate] = useState<Person | null>(null);
  const [pendingInput, setPendingInput] = useState<CreatePersonInput | null>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm(locked && session?.mahalla ? session.mahalla : defaultMahalla));
      setSkillInput("");
      setDuplicate(null);
      setPendingInput(null);
    }
  }, [open, defaultMahalla, locked, session?.mahalla]);

  const age = calcAge(form.birthDate);
  const ageValid = age != null && age >= 18 && age <= 30;
  const requiredFilled =
    form.lastName.trim() &&
    form.firstName.trim() &&
    form.patronymic.trim() &&
    form.birthDate &&
    ageValid &&
    form.mahalla &&
    form.educationLevel &&
    form.status &&
    form.source;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    set("skills", [...form.skills, trimmed]);
    setSkillInput("");
  };

  const buildInput = (): CreatePersonInput => ({
    lastName: form.lastName.trim(),
    firstName: form.firstName.trim(),
    patronymic: form.patronymic.trim(),
    gender: form.gender,
    birthDate: form.birthDate,
    mahalla: form.mahalla,
    streetBlock: form.streetBlock.trim(),
    educationLevel: form.educationLevel,
    educationInstitution: form.educationInstitution.trim() || null,
    specialty: form.specialty.trim() || null,
    status: form.status,
    activity: form.activity.trim(),
    isFormalEmployment: form.isFormalEmployment,
    workExperienceMonths: form.workExperienceMonths,
    skills: form.skills,
    desiredDirection: form.desiredDirection,
    householdSize: form.householdSize,
    maritalStatus: form.maritalStatus,
    lastUpdateSource: form.source as UpdateSource,
  });

  const findDuplicate = (input: CreatePersonInput): Person | undefined => {
    const fullName = buildFullName(input.gender, input.lastName, input.firstName, input.patronymic);
    return people.find((p) => p.fullName === fullName && p.birthDate === input.birthDate);
  };

  const submitCreate = (input: CreatePersonInput) => {
    const id = createPerson(input);
    onOpenChange(false);
    toast.success(t("toast.recordCreated"), {
      action: {
        label: t("common.openProfile"),
        onClick: () => navigate({ to: "/person/$id", params: { id } }),
      },
    });
  };

  const handleSave = () => {
    if (!requiredFilled || !form.source) return;
    const input = buildInput();
    const dup = findDuplicate(input);
    if (dup) {
      setPendingInput(input);
      setDuplicate(dup);
      return;
    }
    submitCreate(input);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("create.title")}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t("create.subtitle")}</p>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <ReqField label={t("create.lastName")}>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </ReqField>
            <ReqField label={t("create.firstName")}>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </ReqField>
            <ReqField label={t("create.patronymic")}>
              <Input value={form.patronymic} onChange={(e) => set("patronymic", e.target.value)} />
            </ReqField>

            <ReqField label={t("create.gender")}>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.gender === "Мужской" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => set("gender", "Мужской")}
                >
                  {labels.genderShort("Мужской")}
                </Button>
                <Button
                  type="button"
                  variant={form.gender === "Женский" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => set("gender", "Женский")}
                >
                  {labels.genderShort("Женский")}
                </Button>
              </div>
            </ReqField>

            <ReqField label={t("create.birthDate")}>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
              />
              {form.birthDate && !ageValid && (
                <p className="mt-1 text-xs text-danger">{t("create.ageHint")}</p>
              )}
            </ReqField>

            <ReqField label={t("create.mahalla")}>
              <Select
                value={form.mahalla}
                onValueChange={(v) => set("mahalla", v as Mahalla)}
                disabled={locked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAHALLAS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ReqField>

            <Field label={t("create.zone")}>
              <Input value={form.streetBlock} onChange={(e) => set("streetBlock", e.target.value)} />
            </Field>

            <ReqField label={t("create.educationLevel")}>
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
            </ReqField>

            <Field label={t("create.institution")}>
              <Input
                value={form.educationInstitution}
                onChange={(e) => set("educationInstitution", e.target.value)}
              />
            </Field>

            <Field label={t("create.specialty")}>
              <Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
            </Field>

            <ReqField label={t("create.employmentStatus")}>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as Person["status"])}
              >
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
            </ReqField>

            <Field label={t("create.workplace")}>
              <Input value={form.activity} onChange={(e) => set("activity", e.target.value)} />
            </Field>

            <Field label={t("create.official")}>
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

            <Field label={t("create.experienceMonths")}>
              <Input
                type="number"
                min={0}
                value={form.workExperienceMonths}
                onChange={(e) => set("workExperienceMonths", Number(e.target.value) || 0)}
              />
            </Field>

            <Field label={t("create.desiredDirection")}>
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

            <Field label={t("create.familySize")}>
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

            <Field label={t("create.marital")}>
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

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <ReqField label={t("create.basis")}>
                <Select value={form.source} onValueChange={(v) => set("source", v as UpdateSource)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("create.selectBasis")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATE_UPDATE_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {labels.source(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ReqField>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={!requiredFilled} onClick={handleSave}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!duplicate} onOpenChange={(v) => !v && setDuplicate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("create.duplicateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("create.duplicateBody", {
                name: duplicate?.fullName ?? "",
                id: duplicate?.id ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingInput(null)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingInput) submitCreate(pendingInput);
                setDuplicate(null);
                setPendingInput(null);
              }}
            >
              {t("create.duplicateConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ReqField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">
        {label} <span className="text-danger">*</span>
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
