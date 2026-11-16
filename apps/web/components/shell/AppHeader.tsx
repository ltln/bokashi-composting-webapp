import Link from "next/link";
import { shell } from "@/content/shell";
import { site } from "@/content/site";
import { LogoMark } from "./icons";
import { NavTabs } from "./NavTabs";

/**
 * App header. Mobile: 56 px, transparent over the motif (Main/FaqList boards).
 * Desktop: white top bar with a 1280 px container and the tabs (DeskSetup/DeskFaq).
 * No Share button (dropped by decision).
 */
export function AppHeader() {
  return (
    <header className="md:border-b md:border-bk-divider md:bg-bk-surface">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-4 pl-4 pr-2 md:h-auto md:min-h-16 md:px-8 md:py-2.5">
        <Link
          href="/setup/1"
          aria-label={shell.homeLabel}
          className="flex min-h-touch min-w-0 items-center gap-2.5 rounded-bk-sm text-bk-ink no-underline hover:text-bk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
        >
          <LogoMark className="size-8 flex-none md:size-[34px]" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-base font-bold leading-5">{site.name}</span>
            <span className="truncate text-xs leading-4 text-bk-muted">{site.tagline}</span>
          </span>
        </Link>
        <NavTabs variant="top" />
      </div>
    </header>
  );
}
