// Inline SVG icons for the shell, copied from the design boards (Main, DeskSetup).
// Logo fills use the bk-* tokens through Tailwind fill-/stroke- utilities.
import type { ReactNode } from "react";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="10" className="fill-bk-primary" />
      <path
        d="M9 13h14l-1.6 11a2 2 0 0 1-2 1.7h-6.8a2 2 0 0 1-2-1.7z"
        fill="none"
        className="stroke-white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 13c0-4 2.5-6.5 6-6.5 0 3.6-2.4 6.5-6 6.5z" className="fill-bk-leaf" />
    </svg>
  );
}

function StrokeIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Tab 1: the bin. */
export function BinIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 7h16l-1.6 12.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z" />
      <path d="M3 4h18v3H3z" />
      <path d="M6 15h12" />
    </StrokeIcon>
  );
}

/** Tab 2: question mark in a circle. */
export function HelpIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
      <path d="M12 17h.01" />
    </StrokeIcon>
  );
}
