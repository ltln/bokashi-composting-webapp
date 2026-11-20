"use client";

import { getSite } from "@/content/site";
import { useLocale } from "@/lib/i18n";

export function Logo({ size, textClass }: { size: number; textClass: string }) {
  const { locale } = useLocale();
  const siteCopy = getSite(locale);

  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="10" className="fill-bk-primary" />
        <path
          d="M9 13h14l-1.6 11a2 2 0 0 1-2 1.7h-6.8a2 2 0 0 1-2-1.7z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M16 13c0-4 2.5-6.5 6-6.5 0 3.6-2.4 6.5-6 6.5z" className="fill-bk-leaf" />
      </svg>
      <span className={`font-bold text-bk-primary-dark ${textClass}`}>{siteCopy.name}</span>
    </div>
  );
}
