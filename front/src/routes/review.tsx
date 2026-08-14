import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { REVIEW_STATUSES, daysAgo, type ReviewStatus } from "@/lib/data";
import { EmptyState, PageHeader, StatusBadge } from "@/components/common";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Требуют внимания — Yoshlar Radar" },
      {
        name: "description",
        content: "Очередь проверки флагов NEET: канбан-доска по стадиям верификации.",
      },
      { property: "og:title", content: "Требуют внимания — Yoshlar Radar" },
      { property: "og:description", content: "Очередь проверки флагов NEET по махаллям района." },
    ],
  }),
  component: Review,
});

const COLUMN_TONE: Record<ReviewStatus, string> = {
  "Ожидает проверки": "bg-warning",
  "На уточнении": "bg-primary",
  Подтверждено: "bg-danger",
  "Флаг снят": "bg-success",
};

function Review() {
  const { scopedPeople, setReviewStatus } = useStore();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ReviewStatus | null>(null);

  const cases = scopedPeople.filter((p) => p.neet || p.neetReviewStatus !== "Флаг снят");

  return (
    <div>
      <PageHeader title="Требуют внимания" subtitle={`Случаев в работе: ${cases.length}`} />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" />
        <p>
          Флаг NEET — это сигнал для проверки уполномоченным сотрудником, а не окончательный
          административный статус.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {REVIEW_STATUSES.map((col) => {
          const items = cases.filter((p) => p.neetReviewStatus === col);
          return (
            <div
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col);
              }}
              onDragLeave={() => setOver((o) => (o === col ? null : o))}
              onDrop={() => {
                if (dragId) {
                  const person = cases.find((p) => p.id === dragId);
                  setReviewStatus(dragId, col);
                  toast.success(`Перемещено: ${col}`, { description: person?.fullName });
                }
                setDragId(null);
                setOver(null);
              }}
              className={cn(
                "rounded-xl border bg-muted/30 p-3 transition-colors",
                over === col ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("size-2 rounded-full", COLUMN_TONE[col])} />
                <h2 className="text-sm font-semibold">{col}</h2>
                <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.length === 0 && <EmptyState text="Пусто" />}
                {items.slice(0, 40).map((p) => (
                  <article
                    key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "cursor-grab rounded-xl border border-border bg-card p-3 active:cursor-grabbing",
                      dragId === p.id && "opacity-50",
                    )}
                  >
                    <div className="text-sm font-medium">{p.fullName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {p.age} лет · {p.mahalla}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-muted-foreground">
                        {daysAgo(p.lastUpdate)} дн.
                      </span>
                    </div>
                    <Link
                      to="/person/$id"
                      params={{ id: p.id }}
                      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Открыть профиль →
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
