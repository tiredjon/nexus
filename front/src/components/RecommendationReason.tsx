import { explainRecommendation } from "@/lib/ai";
import type { Person, Program } from "@/lib/data";
import { AiBadge, AiError, AiLoading, AiTypewriter, useAiResult } from "@/components/ai";

export function RecommendationReason({ person, program }: { person: Person; program: Program }) {
  const { loading, data, error, retry } = useAiResult(
    () => explainRecommendation(person, program),
    [person.id, program, person.lastUpdate],
  );

  if (loading) return <AiLoading label="Формирую обоснование" />;

  if (error) return <AiError onRetry={retry} />;

  if (!data) return null;

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        Основание: <AiBadge />
      </span>{" "}
      <AiTypewriter text={data} />
    </p>
  );
}
