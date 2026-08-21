import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { parseFieldNote, type ParsedNote } from "@/lib/ai";
import type { Person } from "@/lib/data";
import type { AiPrefill, EditableFormState } from "@/components/EditPersonDialog";
import { useLanguage } from "@/lib/i18n";
import { AiBadge, AiError, AiLoading, AiTypewriter } from "@/components/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function mapParsedNoteToPrefill(note: ParsedNote, person: Person): AiPrefill {
  const form: Partial<EditableFormState> = {};
  const highlighted: (keyof EditableFormState)[] = [];

  const statusMap: Record<string, Person["status"]> = {
    Безработный: "Безработный",
    "Неофициальная занятость": "Работает",
    "Уход за ребёнком": "Другая деятельность",
    "Трудовая миграция": "Статус не уточнён",
    Учится: "Учится",
    Предприниматель: "Предприниматель",
  };

  const mapped = statusMap[note.status];
  if (mapped && mapped !== person.status) {
    form.status = mapped;
    highlighted.push("status");
    if (note.status === "Неофициальная занятость") {
      form.isFormalEmployment = false;
      highlighted.push("isFormalEmployment");
    }
  }

  if (note.activityDetail) {
    form.activity = note.activityDetail;
    highlighted.push("activity");
  }

  if (note.need === "Профессиональное обучение") {
    form.desiredDirection = "Профессиональное обучение";
    highlighted.push("desiredDirection");
  }

  if (note.direction) {
    if (/свар/i.test(note.direction)) {
      form.specialty = "Сварочное дело";
      highlighted.push("specialty");
      const skills = [...person.skills];
      if (!skills.includes("сварка")) skills.push("сварка");
      form.skills = skills;
      highlighted.push("skills");
    } else if (/цифров/i.test(note.direction)) {
      const skills = [...person.skills];
      if (!skills.includes("компьютерная грамотность")) skills.push("компьютерная грамотность");
      form.skills = skills;
      highlighted.push("skills");
    }
  }

  return {
    form,
    highlightedFields: highlighted,
    defaultSource: "Подворный обход",
    historyTitle: "__fieldNoteUpdated__",
  };
}

function ParseResultLines({ result }: { result: ParsedNote }) {
  const { t } = useLanguage();
  const lines: string[] = [t("fieldNote.line.status", { value: result.status })];
  if (result.activityDetail) {
    lines.push(t("fieldNote.line.activity", { value: result.activityDetail }));
  }
  if (result.need) lines.push(t("fieldNote.line.need", { value: result.need }));
  if (result.direction) lines.push(t("fieldNote.line.direction", { value: result.direction }));
  if (result.flags.length) {
    lines.push(t("fieldNote.line.flags", { value: result.flags.join(" · ") }));
  }

  return (
    <div className="space-y-1 text-sm">
      {lines.map((line, i) => (
        <div key={line}>
          <AiTypewriter text={line} startDelay={i * 400} />
        </div>
      ))}
    </div>
  );
}

export function FieldNoteSection({
  person,
  onApply,
}: {
  person: Person;
  onApply: (prefill: AiPrefill) => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<ParsedNote | null>(null);
  const { t, locale } = useLanguage();

  const canParse = note.trim().length >= 15;

  const runParse = async () => {
    if (!canParse) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const parsed = await parseFieldNote(note, person, locale);
      setResult(parsed);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{t("fieldNote.title")}</h2>

      <div className="mt-3 flex gap-2">
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("fieldNote.placeholder")}
          className="flex-1"
        />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0 self-start">
                <Mic className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("fieldNote.voiceInput")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button className="mt-3" disabled={!canParse || loading} onClick={runParse}>
        <Sparkles className="size-4" /> {t("fieldNote.parse")}
      </Button>

      {loading && (
        <div className="mt-4">
          <AiLoading label={t("fieldNote.analyzing")} />
        </div>
      )}

      {error && (
        <div className="mt-4">
          <AiError onRetry={runParse} />
        </div>
      )}

      {result && !loading && (
        <div className="mt-4 rounded-xl border border-[#c7d2fe] bg-[#f8fafc] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {t("fieldNote.result")} <AiBadge />
            </div>
            <span className="text-xs text-muted-foreground">
              {t("fieldNote.confidence", { value: result.confidence })}
            </span>
          </div>

          <div className="mt-3">
            <ParseResultLines result={result} />
          </div>

          <p className="mt-4 text-xs italic text-muted-foreground">{t("fieldNote.disclaimer")}</p>

          <div className="mt-3 flex gap-2">
            <Button onClick={() => onApply(mapParsedNoteToPrefill(result, person))}>
              {t("fieldNote.apply")}
            </Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              {t("fieldNote.reject")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
