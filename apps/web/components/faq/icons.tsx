import type { ReactNode } from "react";
import type { FaqSlug } from "@/content/types";

/**
 * Tab 2 UI icons, paths copied from the FaqList / Faq boards. All are 24×24
 * stroke icons that inherit `currentColor` and are decorative.
 */
const PATHS: Record<FaqSlug, ReactNode> = {
  smell: (
    <>
      <path d="M7 20c-2-3 2-5 0-8s2-5 0-8" />
      <path d="M12 20c-2-3 2-5 0-8s2-5 0-8" />
      <path d="M17 20c-2-3 2-5 0-8s2-5 0-8" />
    </>
  ),
  maggots: (
    <>
      <ellipse cx="12" cy="14" rx="4" ry="6" />
      <path d="M12 8V5M8.5 9.5 5 7M15.5 9.5 19 7M8 14H4M16 14h4M8.5 18 5.5 20M15.5 18l3 2" />
    </>
  ),
  liquid: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  mold: (
    <>
      <path d="M3 18h18" />
      <circle cx="7" cy="14" r="2" />
      <circle cx="13" cy="13" r="3" />
      <circle cx="18.5" cy="15" r="1.5" />
    </>
  ),
  disposal: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z" />
      <path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z" />
      <path d="M7 21h10" />
    </>
  ),
};

function Icon({ size, className, children, stroke = 2 }: { size: number; className?: string; children: ReactNode; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

/** The category glyph on a list card's tinted tile. */
export function FaqIcon({ slug, size = 24 }: { slug: FaqSlug; size?: number }) {
  return <Icon size={size}>{PATHS[slug]}</Icon>;
}

export function ChevronLeft({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  );
}

export function ChevronRight({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowRight({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function BulbIcon({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </Icon>
  );
}

export function CheckIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className} stroke={3}>
      <path d="M5 12l5 5 9-10" />
    </Icon>
  );
}

export function CrossIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className} stroke={3}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}
