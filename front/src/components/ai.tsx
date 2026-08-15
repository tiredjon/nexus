import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold text-[#4338ca]">
      <Sparkles className="size-3" />
      ИИ
    </span>
  );
}

export function AiLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-[#4338ca]"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}

export function AiTypewriter({
  text,
  className,
  onComplete,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  onComplete?: () => void;
  startDelay?: number;
}) {
  const [shown, setShown] = useState(startDelay > 0 ? "" : "");

  useEffect(() => {
    if (!text) {
      setShown("");
      onComplete?.();
      return;
    }

    let cancelled = false;
    const words = text.split(/\s+/);
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;

    const start = () => {
      timer = setInterval(() => {
        if (cancelled) return;
        index++;
        setShown(words.slice(0, index).join(" "));
        if (index >= words.length) {
          clearInterval(timer);
          onComplete?.();
        }
      }, 25);
    };

    if (startDelay > 0) {
      setShown("");
      const delayTimer = setTimeout(start, startDelay);
      return () => {
        cancelled = true;
        clearTimeout(delayTimer);
        clearInterval(timer);
      };
    }

    setShown("");
    start();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [text, onComplete, startDelay]);

  return <span className={cn(className)}>{shown}</span>;
}

export function AiError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <p className="text-muted-foreground">Не удалось сформировать. Попробуйте ещё раз</p>
      <button type="button" className="mt-2 text-sm font-medium text-primary hover:underline" onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}

export function useAiResult<T>(fn: () => Promise<T>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<{
    loading: boolean;
    data: T | null;
    error: boolean;
    key: number;
  }>({ loading: enabled, data: null, error: false, key: 0 });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: null, error: false, key: 0 });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: false }));

    fn()
      .then((data) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, data, error: false }));
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, data: null, error: true }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, state.key]);

  const retry = () => setState((s) => ({ ...s, key: s.key + 1, error: false }));

  return { ...state, retry };
}
