import type { ReactNode } from "react";
import { FeatureTarget } from "@bokashi/contracts/events";
import { getShell } from "@/content/shell";
import type { Locale } from "@/lib/i18n";
import { BinIcon, HelpIcon } from "./icons";

export type TabId = "setup" | "faq";

export interface AppTab {
  id: TabId;
  href: string;
  label: string;
  featureTarget: typeof FeatureTarget.Tab1Setup | typeof FeatureTarget.Tab2FAQ;
  Icon: (props: { className?: string }) => ReactNode;
}

export function getAppTabs(locale: Locale = "vi"): readonly AppTab[] {
  const s = getShell(locale);
  return [
    {
      id: "setup",
      href: "/setup/1",
      label: s.tabs.setup,
      featureTarget: FeatureTarget.Tab1Setup,
      Icon: BinIcon,
    },
    {
      id: "faq",
      href: "/faq",
      label: s.tabs.faq,
      featureTarget: FeatureTarget.Tab2FAQ,
      Icon: HelpIcon,
    },
  ];
}

export const APP_TABS: readonly AppTab[] = getAppTabs("vi");

/** `/setup/*` → Tab 1, `/faq` and `/faq/*` → Tab 2, anything else → none. */
export function activeTabFor(pathname: string | null): TabId | null {
  if (!pathname) return null;
  if (pathname === "/setup" || pathname.startsWith("/setup/")) return "setup";
  if (pathname === "/faq" || pathname.startsWith("/faq/")) return "faq";
  return null;
}
