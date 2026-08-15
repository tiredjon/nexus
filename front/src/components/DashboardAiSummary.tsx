import { Sparkles } from "lucide-react";
import { buildDashboardStats, generateDashboardSummary } from "@/lib/ai";
import type { Person } from "@/lib/data";
import type { Role } from "@/lib/permissions";
import { AiBadge, AiError, AiLoading, AiTypewriter, useAiResult } from "@/components/ai";

export function DashboardAiSummary({
  scopedPeople,
  allPeople,
  role,
  mahalla,
  syncedAt,
}: {
  scopedPeople: Person[];
  allPeople: Person[];
  role: Role;
  mahalla?: string;
  syncedAt: Date;
}) {
  const stats = buildDashboardStats(scopedPeople, allPeople, role, mahalla);

  const { loading, data, error, retry } = useAiResult(
    () => generateDashboardSummary(stats, role),
    [scopedPeople.length, role, mahalla, syncedAt.getTime()],
  );

  const timeLabel = syncedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="yr-card mb-6 border-l-[3px] border-l-[#4338ca] bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-[#4338ca]" />
          Сводка по данным
          <AiBadge />
        </div>
        <span className="text-xs text-muted-foreground">обновлено {timeLabel}</span>
      </div>

      <div className="mt-3">
        {loading && <AiLoading label="Анализирую показатели" />}
        {error && <AiError onRetry={retry} />}
        {data && !loading && (
          <>
            <p className="text-sm font-medium">
              <AiTypewriter text={data.headline} />
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {data.points.map((point, i) => (
                <li key={point}>
                  <AiTypewriter text={point} startDelay={800 + i * 600} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Сводка сформирована по агрегированным показателям и носит информационный характер.
      </p>
    </section>
  );
}
