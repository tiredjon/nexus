import { useEffect, useRef } from "react";
import {
  buildAnalyticsStats,
  buildDashboardStats,
  generateDashboardSummary,
  generateOfficialReport,
} from "@/lib/ai";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";

// Незаметно прогревает кэш ИИ сразу после входа: дашбордную сводку и
// официальную справку с настройками по умолчанию (период «month», весь район).
// Во время демо эти экраны отрисуются мгновенно из кэша, без ожидания LLM.
// Прогрев fire-and-forget: ошибки глушим, он полностью опционален. Карточки
// людей персональные — их прогреть заранее нельзя, открой нужную вручную перед
// показом (результат тоже закэшируется).
//
// Греется только язык, активный при входе (done.current пускает эффект один
// раз). После переключения RU/UZ кэш под новый язык пустой и первая сводка
// подгрузится с задержкой — если демо идёт на узбекском, переключи язык до
// входа, а не после.
export function usePrewarmAi() {
  const { session, people, scopedPeople } = useStore();
  const { t, locale } = useLanguage();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !session || people.length === 0) return;
    done.current = true;

    const dashStats = buildDashboardStats(
      scopedPeople,
      people,
      session.role,
      session.mahalla ?? undefined,
    );
    void generateDashboardSummary(dashStats, session.role, locale).catch(() => {});

    const reportStats = buildAnalyticsStats(people, t("report.territoryDistrict"));
    void generateOfficialReport(reportStats, "month", locale).catch(() => {});
  }, [session, people, scopedPeople, t, locale]);
}
