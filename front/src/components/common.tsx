import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { daysAgo, type EmploymentStatus, type Person } from "@/lib/data";
import {
  computePriorityLevel,
  computePriorityReasons,
  type PriorityLevel,
} from "@/lib/person-compute";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const YR_CARD = "yr-card";
export const YR_CARD_INTERACTIVE = "yr-card yr-card-interactive";

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
    <span className="inline-flex items-center rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
      NEET
    </span>
  );
}

const PRIORITY_STYLE: Record<Exclude<PriorityLevel, "Обычный">, string> = {
  Высокий: "bg-[#fef3c7] text-[#b45309]",
  Средний: "bg-[#e0e7ff] text-[#3730a3]",
};

export function PriorityBadge({ person }: { person: Person }) {
  const level = computePriorityLevel(person);
  if (level === "Обычный") return null;

  const reasons = computePriorityReasons(person);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-default items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              PRIORITY_STYLE[level],
            )}
          >
            {level}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <ul className="space-y-1">
            {reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FreshnessDot({ person }: { person: Person }) {
  const d = daysAgo(person.lastUpdate);
  const color = d > 90 ? "bg-danger" : d > 45 ? "bg-warning" : "bg-success";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
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
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  text,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: {
  text: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/60 bg-card p-10 text-center">
      <Icon className="mb-3 size-8 text-muted-foreground/40" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{text}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
