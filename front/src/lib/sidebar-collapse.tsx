import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";

const STORAGE_KEY = "yr-sidebar-collapsed";
export const SIDEBAR_TRANSITION_EVENT = "yr-sidebar-transition-end";

type SidebarCollapseContextValue = {
  collapsed: boolean;
  animating: boolean;
  toggle: () => void;
  onLayoutTransitionEnd: (event: TransitionEvent<HTMLElement>) => void;
};

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(null);

function syncSidebarDom(collapsed: boolean, animating: boolean) {
  const root = document.documentElement;
  root.style.setProperty("--yr-sidebar-w", collapsed ? "68px" : "260px");
  root.classList.toggle("yr-sidebar-collapsed", collapsed);
  root.classList.toggle("is-sidebar-animating", animating);
}

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "true";
    setCollapsed(stored);
    syncSidebarDom(stored, false);
  }, []);

  useEffect(() => {
    syncSidebarDom(collapsed, animating);
  }, [collapsed, animating]);

  const toggle = useCallback(() => {
    setAnimating(true);
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const onLayoutTransitionEnd = useCallback((event: TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== "grid-template-columns") return;
    setAnimating(false);
    window.dispatchEvent(new CustomEvent(SIDEBAR_TRANSITION_EVENT));
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      animating,
      toggle,
      onLayoutTransitionEnd,
    }),
    [collapsed, animating, toggle, onLayoutTransitionEnd],
  );

  return (
    <SidebarCollapseContext.Provider value={value}>{children}</SidebarCollapseContext.Provider>
  );
}

export function SidebarLayoutRoot({ children }: { children: ReactNode }) {
  const { onLayoutTransitionEnd } = useSidebarCollapse();

  return (
    <div className="yr-app-layout bg-background" onTransitionEnd={onLayoutTransitionEnd}>
      {children}
    </div>
  );
}

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    throw new Error("useSidebarCollapse must be used within SidebarCollapseProvider");
  }
  return ctx;
}
