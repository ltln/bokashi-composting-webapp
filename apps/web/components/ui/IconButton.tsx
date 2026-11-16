import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type IconButtonVariant = "primary" | "outline" | "ghost";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Required: icon-only buttons need an accessible name (Vietnamese, from content/). */
  "aria-label": string;
  /**
   * - primary: solid primary circle (pause/play)
   * - outline: white with border (replay)
   * - ghost:   transparent (header actions)
   * Default "ghost".
   */
  variant?: IconButtonVariant;
}

const VARIANT: Record<IconButtonVariant, string> = {
  primary: "bg-bk-primary text-white hover:bg-bk-primary-dark",
  outline: "border border-bk-border bg-bk-surface text-bk-ink",
  ghost: "bg-transparent text-bk-ink",
};

/** 44×44 round icon button. Pass the icon (aria-hidden SVG) as children. */
export function IconButton({ variant = "ghost", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex size-touch flex-none items-center justify-center rounded-full",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary",
        "disabled:opacity-50",
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  );
}
