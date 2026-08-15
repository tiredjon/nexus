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
  ChevronLeft,
} from "lucide-react";
import { memo, useCallback, useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { usePrewarmAi } from "@/lib/prewarm";
import { getRoleConfig, TAB_ROUTES, type TabId } from "@/lib/permissions";
import { useLanguage, useLabels, LanguageSwitcher, type TranslationKey } from "@/lib/i18n";
import {
  SidebarCollapseProvider,
  SidebarLayoutRoot,
  useSidebarCollapse,
} from "@/lib/sidebar-collapse";
import { RolePicker } from "./RolePicker";
import { RouteGuard } from "./RouteGuard";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const TAB_NAV: Record<TabId, { labelKey: TranslationKey; icon: React.ElementType }> = {
  dashboard: { labelKey: "nav.dashboard", icon: LayoutDashboard },
  map: { labelKey: "nav.map", icon: Map },
  registry: { labelKey: "nav.registry", icon: Users },
  review: { labelKey: "nav.review", icon: AlertTriangle },
  programs: { labelKey: "nav.programs", icon: Briefcase },
  analytics: { labelKey: "nav.analytics", icon: BarChart3 },
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session } = useStore();

  if (!session) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute right-4 top-4 z-50">
          <LanguageSwitcher />
        </div>
        <RolePicker />
      </div>
    );
  }

  return (
    <SidebarCollapseProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </SidebarCollapseProvider>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobileMenu = useCallback(() => setMobileOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);
  usePrewarmAi();

  return (
    <SidebarLayoutRoot>
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={closeMobileMenu} />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
      <MainColumn onOpenMobileMenu={openMobileMenu}>{children}</MainColumn>
    </SidebarLayoutRoot>
  );
}

const AppSidebar = memo(function AppSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { session, signOut } = useStore();
  const { t } = useLanguage();
  const labels = useLabels();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { collapsed, toggle } = useSidebarCollapse();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const narrow = collapsed && isDesktop;

  if (!session) return null;

  const config = getRoleConfig(session.role);
  const roleLabel = labels.roleLabel(session.role);
  const navItems = config.tabs.map((tab) => ({
    tab,
    to: TAB_ROUTES[tab],
    icon: TAB_NAV[tab].icon,
    label: t(TAB_NAV[tab].labelKey),
  }));

  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const roleInitial = roleLabel.charAt(0).toUpperCase();
  const territory = labels.territory(session);
  const roleTip = `${roleLabel} · ${territory}`;

  return (
    <aside
      className={cn(
        "yr-sidebar-panel fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card transition-transform duration-[180ms] ease-out lg:static lg:h-screen lg:w-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t("common.expandMenu") : t("common.collapseMenu")}
        className="absolute -right-3 top-5 z-50 hidden size-6 transform-gpu items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:flex"
      >
        <ChevronLeft
          className={cn("size-3.5 transition-transform duration-[180ms]", collapsed && "rotate-180")}
        />
      </button>

      <div
        className={cn(
          "flex shrink-0 items-center gap-2 py-5",
          narrow ? "justify-center px-2" : "px-5",
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Radar className="size-5 text-primary-foreground" />
        </div>
        <div
          className={cn(
            "yr-sidebar-fade min-w-0 overflow-hidden",
            narrow ? "pointer-events-none w-0 opacity-0" : "opacity-100",
          )}
        >
          <div className="whitespace-nowrap text-sm font-semibold leading-tight">Yoshlar Radar</div>
          <div className="whitespace-nowrap text-xs text-muted-foreground">
            {t("territory.districtSubtitle")}
          </div>
        </div>
      </div>

      <nav
        className={cn(
          "yr-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto py-3",
          narrow ? "px-2" : "px-3",
        )}
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            data-tip={narrow ? item.label : undefined}
            aria-label={narrow ? item.label : undefined}
            className={cn(
              "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors duration-150",
              narrow ? "yr-nav-tip justify-center px-2" : "gap-3 px-3",
              active(item.to)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span
              className={cn(
                "yr-sidebar-fade overflow-hidden whitespace-nowrap",
                narrow ? "w-0 opacity-0" : "opacity-100",
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <div className={cn("mt-auto shrink-0 p-3", narrow && "flex justify-center")}>
        {narrow ? (
          <button
            type="button"
            onClick={signOut}
            aria-label={t("common.changeRole")}
            data-tip={roleTip}
            className="yr-nav-tip yr-role-tip flex size-10 transform-gpu items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
          >
            {roleInitial}
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="text-xs font-medium text-muted-foreground">{t("common.currentRole")}</div>
            <div className="mt-1 text-sm font-semibold">{roleLabel}</div>
            {"isSystemRole" in config && config.isSystemRole && (
              <span className="mt-1 inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("common.demoAccess")}
              </span>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{territory}</div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={signOut}>
              <LogOut className="size-3.5" /> {t("common.changeRole")}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
});

const MainColumn = memo(function MainColumn({
  children,
  onOpenMobileMenu,
}: {
  children: ReactNode;
  onOpenMobileMenu: () => void;
}) {
  const { syncedAt, loading } = useStore();
  const { t, locale } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const dateLocale = locale === "uz" ? "uz-UZ" : "ru-RU";

  return (
    <div className="yr-main-column flex min-w-0 flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label={t("common.menu")}
        >
          <Menu className="size-5" />
        </Button>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {new Date().toLocaleDateString(dateLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="hidden items-center gap-1.5 sm:flex tabular-nums">
            <RefreshCw className="size-3.5" />
            {t("common.lastSync")}{" "}
            {syncedAt.toLocaleDateString(dateLocale, {
              day: "numeric",
              month: "short",
            })}{" "}
            {syncedAt.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
          </span>
          <LanguageSwitcher />
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
                {t("common.footerDisclaimer")}
              </p>
            </div>
          </RouteGuard>
        )}
      </main>
    </div>
  );
});

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
