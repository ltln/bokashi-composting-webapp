"use client";

import { getShell } from "@/content/shell";
import { cn } from "@/lib/cn";
import { LOCALES, useLocale } from "@/lib/i18n";

/**
 * Compact VI / EN segmented toggle with ≥44×44 px touch targets.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const lang = getShell(locale).language;

  return (
    <div
      role="group"
      aria-label={lang.label}
      className={cn(
        "inline-flex flex-none items-center rounded-bk-sm border border-bk-border bg-bk-surface p-0.5",
        className,
      )}
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={code === "vi" ? lang.viLabel : lang.enLabel}
            onClick={() => setLocale(code)}
            className={cn(
              "min-h-touch min-w-touch rounded-[10px] px-2.5 text-xs font-bold transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary",
              active ? "bg-bk-primary text-white" : "text-bk-muted hover:text-bk-primary-dark",
            )}
          >
            {code === "vi" ? lang.shortVi : lang.shortEn}
          </button>
        );
      })}
    </div>
  );
}
