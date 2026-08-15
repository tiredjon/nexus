import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Radar,
  LogOut,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getRoleConfig, getTerritoryLabel, TAB_ROUTES, type TabId } from "@/lib/permissions";
import { RolePicker } from "./RolePicker";
import { RouteGuard } from "./RouteGuard";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const TAB_NAV: Record<TabId, { label: string; icon: React.ElementType }> = {
  dashboard: { label: "Дашборд", icon: LayoutDashboard },
  map: { label: "Карта района", icon: Map },
  registry: { label: "Реестр молодёжи", icon: Users },
  review: { label: "Требуют внимания", icon: AlertTriangle },
  programs: { label: "Программы", icon: Briefcase },
  analytics: { label: "Аналитика", icon: BarChart3 },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, signOut, syncedAt, loading } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (!session) return <RolePicker />;

  const config = getRoleConfig(session.role);
  const navItems = config.tabs.map((tab) => ({
    tab,
    to: TAB_ROUTES[tab],
    ...TAB_NAV[tab],
  }));

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
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
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
          <div className="mt-1 text-sm font-semibold">{config.label}</div>
          {"isSystemRole" in config && config.isSystemRole && (
            <span className="mt-1 inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              демо-доступ
            </span>
          )}
          <div className="mt-1 text-xs text-muted-foreground">{getTerritoryLabel(session)}</div>
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
            <span className="hidden items-center gap-1.5 sm:flex tabular-nums">
              <RefreshCw className="size-3.5" />
              Последняя синхронизация:{" "}
              {syncedAt.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}{" "}
              {syncedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6">
          {loading ? (
            <PageSkeleton />
          ) : (
            <RouteGuard>
              <div key={pathname} className="yr-page-enter">
                {children}
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  Демонстрационный прототип · данные синтетические, персональные сведения не
                  используются
                </p>
              </div>
            </RouteGuard>
          )}
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
          <div key={i} className="yr-card h-28 animate-pulse bg-muted p-5" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="yr-card h-72 animate-pulse bg-muted lg:col-span-1" />
        <div className="yr-card h-72 animate-pulse bg-muted lg:col-span-2" />
      </div>
    </div>
  );
}
