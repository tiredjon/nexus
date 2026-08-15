import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { parseFieldNote, type ParsedNote } from "@/lib/ai";
import type { Person } from "@/lib/data";
import type { AiPrefill, EditableFormState } from "@/components/EditPersonDialog";
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
    historyTitle: "Данные уточнены по заметке с обхода (разбор ИИ, подтверждён сотрудником)",
  };
}

function ParseResultLines({ result }: { result: ParsedNote }) {
  const lines: string[] = [`Статус: ${result.status}`];
  if (result.activityDetail) lines.push(`Деятельность: ${result.activityDetail}`);
  if (result.need) lines.push(`Потребность: ${result.need}`);
  if (result.direction) lines.push(`Направление: ${result.direction}`);
  if (result.flags.length) lines.push(`Отмечено: ${result.flags.join(" · ")}`);

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

  const canParse = note.trim().length >= 15;

  const runParse = async () => {
    if (!canParse) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const parsed = await parseFieldNote(note, person);
      setResult(parsed);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">Заметка с обхода</h2>

      <div className="mt-3 flex gap-2">
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Опишите обычными словами, что выяснили при визите"
          className="flex-1"
        />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0 self-start">
                <Mic className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Голосовой ввод</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button className="mt-3" disabled={!canParse || loading} onClick={runParse}>
        <Sparkles className="size-4" /> Разобрать заметку
      </Button>

      {loading && (
        <div className="mt-4">
          <AiLoading label="Анализирую заметку" />
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
              Результат разбора <AiBadge />
            </div>
            <span className="text-xs text-muted-foreground">уверенность: {result.confidence}</span>
          </div>

          <div className="mt-3">
            <ParseResultLines result={result} />
          </div>

          <p className="mt-4 text-xs italic text-muted-foreground">
            Результат носит рекомендательный характер. Изменения вносит сотрудник.
          </p>

          <div className="mt-3 flex gap-2">
            <Button onClick={() => onApply(mapParsedNoteToPrefill(result, person))}>
              Применить к карточке
            </Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              Отклонить
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
