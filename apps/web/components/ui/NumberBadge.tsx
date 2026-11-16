import { cn } from "@/lib/cn";

export type NumberBadgeState = "done" | "current" | "upcoming";

export interface NumberBadgeProps {
  /** 1-based number shown for current/upcoming. */
  number: number;
  /**
   * Checklist bullet state, as in the design:
   * - done:     primary circle with a white check
   * - current:  orange circle with a white number
   * - upcoming: brown outline with a brown number
   */
  state: NumberBadgeState;
  className?: string;
}

/** 22 px checklist bullet. Decorative: the row text carries the meaning. */
export function NumberBadge({ number, state, className }: NumberBadgeProps) {
  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn(
        "box-border flex size-[22px] flex-none items-center justify-center rounded-full text-xs font-bold",
        state === "done" && "bg-bk-primary text-white",
        state === "current" && "bg-bk-accent text-white",
        state === "upcoming" && "border-[1.5px] border-bk-brown text-bk-brown-dark",
        className,
      )}
    >
      {state === "done" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-10" />
        </svg>
      ) : (
        number
      )}
    </span>
  );
}
