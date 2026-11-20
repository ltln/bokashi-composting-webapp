"use client";

import Link from "next/link";
import { getShell } from "@/content/shell";
import { getSite } from "@/content/site";
import { useLocale } from "@/lib/i18n";
import { LogoMark } from "./icons";
import { LanguageToggle } from "./LanguageToggle";
import { NavTabs } from "./NavTabs";

/**
 * App header. Mobile: 56 px, transparent over the motif (Main/FaqList boards).
 * Desktop: white top bar with a 1280 px container, the tabs, and the language toggle.
 * No Share button (dropped by decision).
 */
export function AppHeader() {
  const { locale } = useLocale();
  const shellCopy = getShell(locale);
  const siteCopy = getSite(locale);

  return (
    <header className="md:border-b md:border-bk-divider md:bg-bk-surface">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 pl-4 pr-3 md:h-auto md:min-h-16 md:gap-4 md:px-8 md:py-2.5">
        <Link
          href="/setup/1"
          aria-label={shellCopy.homeLabel}
          className="flex min-h-touch min-w-0 flex-1 items-center gap-2.5 rounded-bk-sm text-bk-ink no-underline hover:text-bk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary md:flex-none"
        >
          <LogoMark className="size-8 flex-none md:size-[34px]" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-base font-bold leading-5">{siteCopy.name}</span>
            <span className="truncate text-xs leading-4 text-bk-muted">{siteCopy.tagline}</span>
          </span>
        </Link>
        <NavTabs variant="top" />
        <LanguageToggle />
      </div>
    </header>
  );
}
