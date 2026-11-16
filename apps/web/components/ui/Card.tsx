import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Default "div". */
  as?: "div" | "article" | "section" | "li" | "aside";
  /** Inner padding. Default "md" (16 px, as the checklist card). */
  padding?: "none" | "sm" | "md";
}

const PADDING = { none: "", sm: "p-3", md: "p-4" } as const;

/** White rounded surface (checklist card, FAQ rows, KPI tiles). */
export function Card({ as: Tag = "div", padding = "md", className, ...rest }: CardProps) {
  return <Tag className={cn("rounded-bk-card bg-bk-surface", PADDING[padding], className)} {...rest} />;
}
