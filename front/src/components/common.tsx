import { daysAgo, type EmploymentStatus, type Person } from "@/lib/data";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<EmploymentStatus, string> = {
  Работает: "bg-success/10 text-success border-success/20",
  Учится: "bg-primary/10 text-primary border-primary/20",
  Предприниматель: "bg-chart-5/10 text-chart-5 border-chart-5/25",
  "Другая деятельность": "bg-muted text-muted-foreground border-border",
  Безработный: "bg-danger/10 text-danger border-danger/20",
  "Статус не уточнён": "bg-warning/15 text-warning border-warning/30",
  "Направлен на программу": "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLE[status],
      )}
    >
      {status}
    </span>
  );
}

export function NeetBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
      NEET
    </span>
  );
}

export function FreshnessDot({ person }: { person: Person }) {
  const d = daysAgo(person.lastUpdate);
  const color = d > 90 ? "bg-danger" : d > 45 ? "bg-warning" : "bg-success";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
      <span className={cn("size-2 rounded-full", color)} />
      обновлено {d} дн. назад
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
