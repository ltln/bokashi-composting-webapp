"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EventType } from "@bokashi/contracts/events";
import { getShell } from "@/content/shell";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { track } from "@/lib/tracking";
import { activeTabFor, getAppTabs } from "./tabs";

export type NavTabsVariant = "bottom" | "top";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary";

const NAV: Record<NavTabsVariant, string> = {
  // Mobile (<768 px): fixed bottom bar, 76 px + the iOS home-indicator inset.
  bottom: cn(
    "fixed inset-x-0 bottom-0 z-40 flex gap-2 md:hidden",
    "border-t border-bk-divider bg-bk-surface px-3 pt-2",
    "h-[calc(76px+env(safe-area-inset-bottom))] pb-[calc(14px+env(safe-area-inset-bottom))]",
  ),
  // Desktop (≥768 px): tabs centred in the top bar.
  top: "hidden flex-1 justify-center gap-1.5 md:flex",
};

const LINK: Record<NavTabsVariant, { base: string; active: string; idle: string; icon: string }> = {
  bottom: {
    base: "flex min-h-touch flex-1 flex-col items-center justify-center gap-[3px] rounded-bk-md text-xs font-semibold no-underline",
    active: "bg-bk-nav-active text-bk-primary-dark",
    idle: "text-bk-muted hover:text-bk-primary-dark",
    icon: "size-[22px]",
  },
  top: {
    base: "flex min-h-touch items-center gap-2 rounded-bk-sm px-[18px] text-sm font-semibold no-underline",
    active: "bg-bk-nav-active text-bk-primary-dark",
    idle: "text-bk-illo-label hover:bg-bk-ground hover:text-bk-primary-dark",
    icon: "size-[18px]",
  },
};

/**
 * The two app tabs. Rendered twice by the shell: once as the mobile bottom bar
 * and once inside the desktop top bar; CSS shows exactly one of them.
 * Switching to the other tab logs `switch_tab`; re-clicking the active tab does not.
 */
export function NavTabs({ variant }: { variant: NavTabsVariant }) {
  const { locale } = useLocale();
  const shellCopy = getShell(locale);
  const tabs = getAppTabs(locale);
  const active = activeTabFor(usePathname());
  const styles = LINK[variant];

  return (
    <nav aria-label={shellCopy.navLabel} className={NAV[variant]}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(styles.base, FOCUS_RING, isActive ? styles.active : styles.idle)}
            onClick={() => {
              if (!isActive) track(EventType.SwitchTab, tab.featureTarget);
            }}
          >
            <tab.Icon className={styles.icon} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
