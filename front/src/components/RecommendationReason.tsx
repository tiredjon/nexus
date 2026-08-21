import { explainRecommendation } from "@/lib/ai";
import type { Person, Program } from "@/lib/data";
import { useLanguage } from "@/lib/i18n";
import { AiBadge, AiError, AiLoading, AiTypewriter, useAiResult } from "@/components/ai";

export function RecommendationReason({ person, program }: { person: Person; program: Program }) {
  const { t, locale } = useLanguage();
  const { loading, data, error, retry } = useAiResult(
    () => explainRecommendation(person, program, locale),
    [person.id, program, person.lastUpdate, locale],
  );

  if (loading) return <AiLoading label={t("recReason.loading")} />;

  if (error) return <AiError onRetry={retry} />;

  if (!data) return null;

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        {t("recReason.label")} <AiBadge />
      </span>{" "}
      <AiTypewriter text={data} />
    </p>
  );
}
