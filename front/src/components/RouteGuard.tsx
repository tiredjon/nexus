import { useLayoutEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { checkRouteAccess } from "@/lib/permissions";
import { useLanguage } from "@/lib/i18n";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, people } = useStore();
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const lastRedirect = useRef<string | null>(null);

  const access =
    session ? checkRouteAccess(session, pathname, people) : { allowed: true, redirect: "/" };

  useLayoutEffect(() => {
    if (!session || access.allowed) return;
    const key = `${pathname}->${access.redirect}`;
    if (lastRedirect.current === key) return;
    lastRedirect.current = key;
    toast.error(t("toast.routeDenied"));
    navigate({ to: access.redirect, replace: true });
  }, [session, pathname, access.allowed, access.redirect, navigate, t]);

  if (session && !access.allowed) return null;

  return children;
}
