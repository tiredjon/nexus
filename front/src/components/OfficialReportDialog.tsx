import { useMemo, useState } from "react";
import { toast } from "sonner";
import { buildAnalyticsStats, generateOfficialReport } from "@/lib/ai";
import { useLanguage, useLabels } from "@/lib/i18n";
import { MAHALLAS, type Person } from "@/lib/data";
import { AiBadge, AiError, AiLoading, AiTypewriter } from "@/components/ai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportDoc = {
  title: string;
  sections: { heading: string; body: string }[];
};

export function OfficialReportDialog({
  open,
  onOpenChange,
  people,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
}) {
  const { t, locale } = useLanguage();
  const labels = useLabels();
  const [period, setPeriod] = useState("month");
  const [territory, setTerritory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [doc, setDoc] = useState<ReportDoc | null>(null);
  const [visibleSections, setVisibleSections] = useState(0);

  const reportDate = labels.formatDate(new Date().toISOString().slice(0, 10));

  const scopedPeople = useMemo(() => {
    if (territory === "all") return people;
    return people.filter((p) => p.mahalla === territory);
  }, [people, territory]);

  const generate = async () => {
    setLoading(true);
    setError(false);
    setDoc(null);
    setVisibleSections(0);
    try {
      const territoryLabel =
        territory === "all"
          ? t("report.territoryDistrict")
          : t("report.territoryMahalla", { name: territory });
      const stats = buildAnalyticsStats(scopedPeople, territoryLabel);
      const result = await generateOfficialReport(stats, period, locale);
      setDoc(result);
      setVisibleSections(1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fullText = doc
    ? [
        doc.title,
        "",
        ...doc.sections.flatMap((s) => [s.heading, s.body, ""]),
        t("report.disclaimerFull", { date: reportDate }),
      ].join("\n")
    : "";

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("common.copyFailed"));
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spravka-yoshlar-radar.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setDoc(null);
    setError(false);
    setVisibleSections(0);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="flex max-h-[95vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
        </DialogHeader>

        {!doc && !loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">{t("report.period")}</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t("report.period.month")}</SelectItem>
                  <SelectItem value="quarter">{t("report.period.quarter")}</SelectItem>
                  <SelectItem value="half">{t("report.period.half")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("report.territory")}</label>
              <Select value={territory} onValueChange={setTerritory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("report.territory.district")}</SelectItem>
                  {MAHALLAS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button onClick={generate}>{t("report.generate")}</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-8">
            <AiLoading label={t("report.generating")} />
          </div>
        )}

        {error && (
          <div className="py-4">
            <AiError onRetry={generate} />
          </div>
        )}

        {doc && !loading && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="mb-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <AiBadge />
              {t("report.draft")}
            </div>

            <h2 className="text-lg font-semibold leading-snug">
              <AiTypewriter text={doc.title} />
            </h2>

            <div className="mt-6 space-y-6">
              {doc.sections.slice(0, visibleSections).map((section, i) => (
                <div key={section.heading}>
                  <h3 className="text-sm font-semibold">{section.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <AiTypewriter
                      text={section.body}
                      onComplete={() => {
                        if (i + 1 === visibleSections && visibleSections < doc.sections.length) {
                          setVisibleSections((c) => c + 1);
                        }
                      }}
                    />
                  </p>
                </div>
              ))}
            </div>

            {visibleSections >= doc.sections.length && (
              <p className="mt-8 text-xs text-muted-foreground">
                {t("report.disclaimerFull", { date: reportDate })}
              </p>
            )}
          </div>
        )}

        {doc && !loading && visibleSections >= (doc?.sections.length ?? 0) && (
          <DialogFooter className="mt-4 shrink-0 gap-2 sm:justify-start">
            <Button variant="outline" onClick={copyText}>
              {t("report.copy")}
            </Button>
            <Button variant="outline" onClick={downloadTxt}>
              {t("report.download")}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
