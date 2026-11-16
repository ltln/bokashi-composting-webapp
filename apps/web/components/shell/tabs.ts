import type { ReactNode } from "react";
import { FeatureTarget } from "@bokashi/contracts/events";
import { shell } from "@/content/shell";
import { BinIcon, HelpIcon } from "./icons";

export type TabId = "setup" | "faq";

export interface AppTab {
  id: TabId;
  href: string;
  label: string;
  featureTarget: typeof FeatureTarget.Tab1Setup | typeof FeatureTarget.Tab2FAQ;
  Icon: (props: { className?: string }) => ReactNode;
}

export const APP_TABS: readonly AppTab[] = [
  {
    id: "setup",
    href: "/setup/1",
    label: shell.tabs.setup,
    featureTarget: FeatureTarget.Tab1Setup,
    Icon: BinIcon,
  },
  {
    id: "faq",
    href: "/faq",
    label: shell.tabs.faq,
    featureTarget: FeatureTarget.Tab2FAQ,
    Icon: HelpIcon,
  },
];

/** `/setup/*` → Tab 1, `/faq` and `/faq/*` → Tab 2, anything else → none. */
export function activeTabFor(pathname: string | null): TabId | null {
  if (!pathname) return null;
  if (pathname === "/setup" || pathname.startsWith("/setup/")) return "setup";
  if (pathname === "/faq" || pathname.startsWith("/faq/")) return "faq";
  return null;
}
