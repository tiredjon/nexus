import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  AlertTriangle,
  BarChart3,
  Radar,
  LogOut,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { RolePicker } from "./RolePicker";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const NAV = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard },
  { to: "/map", label: "Карта района", icon: Map },
  { to: "/registry", label: "Реестр молодёжи", icon: Users },
  { to: "/review", label: "Требуют внимания", icon: AlertTriangle },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, signOut, syncedAt, loading } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (!session) return <RolePicker />;

  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
            <Radar className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Yoshlar Radar</div>
            <div className="text-xs text-muted-foreground">Мирзо-Улугбекский район</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active(item.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="m-3 rounded-xl border border-border bg-muted/40 p-3">
          <div className="text-xs font-medium text-muted-foreground">Текущая роль</div>
          <div className="mt-1 text-sm font-semibold">
            {session.role === "mahalla" ? "Инспектор махалли" : "Сотрудник хокимията района"}
          </div>
          <div className="text-xs text-muted-foreground">
            {session.role === "mahalla" ? `Махалля ${session.mahalla}` : "Все 12 махаллей"}
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="size-3.5" /> Сменить роль
          </Button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Меню"
          >
            <Menu className="size-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {new Date().toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <RefreshCw className="size-3.5" />
              Последняя синхронизация данных:{" "}
              {syncedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          {loading ? <PageSkeleton /> : children}
        </main>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
