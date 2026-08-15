import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { dictUz } from "./dict-uz";
import { interpolate, ru, type TranslationKey, type TParams } from "./ru";

export type Locale = "ru" | "uz";

const STORAGE_KEY = "yr-locale";

const DICTS: Record<Locale, Record<TranslationKey, string>> = { ru, uz: dictUz };

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ru" || stored === "uz") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TParams) => {
      const value = DICTS[locale][key];
      if (value !== undefined) return interpolate(value, params);

      const fallback = ru[key];
      if (fallback !== undefined) {
        console.warn(`[i18n] missing key "${key}" for locale "${locale}"`);
        return interpolate(fallback, params);
      }

      console.warn(`[i18n] unknown key "${key}"`);
      return key;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
