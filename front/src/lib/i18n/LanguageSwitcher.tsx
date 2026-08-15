import { cn } from "@/lib/utils";
import { useLanguage, type Locale } from "./context";

const LOCALES: Locale[] = ["ru", "uz"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className="inline-flex rounded-md border border-border p-0.5 text-xs font-medium"
      role="group"
      aria-label={t("common.languageLabel")}
    >
      {LOCALES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLocale(lang)}
          aria-pressed={locale === lang}
          className={cn(
            "rounded px-2 py-0.5 uppercase transition-colors duration-150",
            locale === lang
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
