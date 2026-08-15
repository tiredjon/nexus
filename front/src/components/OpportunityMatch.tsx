import { Briefcase, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { recommendOpportunities } from "@/lib/ai";
import type { Person } from "@/lib/data";
import { useLanguage } from "@/lib/i18n";
import { AiBadge, AiError, AiLoading, AiTypewriter, useAiResult } from "@/components/ai";

// ИИ-подбор реальных вакансий и курсов из каталога (src/lib/opportunities.ts)
// под профиль человека. Логика и парсинг — в recommendOpportunities.
export function OpportunityMatch({ person }: { person: Person }) {
  const { t } = useLanguage();
  const { loading, data, error, retry } = useAiResult(
    () => recommendOpportunities(person),
    [person.id, person.lastUpdate, person.skills.join(","), person.desiredDirection],
  );

  return (
    <section className="yr-card mt-4 border-l-[3px] border-l-[#4338ca] bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-[#4338ca]" />
        {t("opportunities.title")}
        <AiBadge />
      </div>

      <div className="mt-3">
        {loading && <AiLoading label={t("opportunities.analyzing")} />}
        {error && <AiError onRetry={retry} />}

        {data && !loading && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Briefcase className="size-3.5" /> {t("opportunities.jobsTitle")}
                </div>
                {data.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("opportunities.emptyJobs")}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.jobs.map(({ job, reason }, i) => (
                      <li key={job.id} className="rounded-lg border border-border bg-background/50 p-3">
                        <div className="text-sm font-medium">{job.title}</div>
                        <div className="text-xs text-muted-foreground">{job.employer}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="size-3" />
                            {job.mahalla}
                          </span>
                          <span>· {job.type}</span>
                          <span>· {job.salary}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          <AiTypewriter text={reason} startDelay={200 + i * 300} />
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <GraduationCap className="size-3.5" /> {t("opportunities.coursesTitle")}
                </div>
                {data.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("opportunities.emptyCourses")}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.courses.map(({ course, reason }, i) => (
                      <li key={course.id} className="rounded-lg border border-border bg-background/50 p-3">
                        <div className="text-sm font-medium">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.provider}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{course.duration}</span>
                          <span>· {course.format}</span>
                          <span>· {course.free ? t("opportunities.free") : t("opportunities.paid")}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          <AiTypewriter text={reason} startDelay={200 + i * 300} />
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <p className="mt-4 text-xs italic text-muted-foreground">{t("opportunities.disclaimer")}</p>
          </>
        )}
      </div>
    </section>
  );
}
