import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type PillTone = "surface" | "brown" | "primary" | "accent" | "tint";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * - surface: white bg, primary-dark text ("Bước 1/3 · …" on the stage)
   * - brown:   brown tint ("10–20% chiều cao" on the checklist card)
   * - primary: solid primary, white text
   * - accent:  solid orange, white text
   * - tint:    surface-tint bg, primary-dark text
   * Default "surface".
   */
  tone?: PillTone;
}

const TONE: Record<PillTone, string> = {
  surface: "bg-bk-surface text-bk-primary-dark",
  brown: "bg-bk-brown-tint text-bk-brown-dark",
  primary: "bg-bk-primary text-white",
  accent: "bg-bk-accent text-white",
  tint: "bg-bk-surface-tint text-bk-primary-dark",
};

/** Small rounded label. */
export function Pill({ tone = "surface", className, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-4",
        TONE[tone],
        className,
      )}
      {...rest}
    />
  );
}
