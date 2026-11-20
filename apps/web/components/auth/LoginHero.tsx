"use client";

import { getLoginCopy } from "@/content/auth";
import { useLocale } from "@/lib/i18n";

/** Hero bin illustration (Login / DeskLogin boards). Floats only when motion is OK. */
export function LoginHero({ size, idPrefix }: { size: number; idPrefix: string }) {
  const { locale } = useLocale();
  const copy = getLoginCopy(locale);
  const clip = `${idPrefix}-in`;

  return (
    <svg
      className="motion-safe:animate-float"
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={copy.illustrationLabel}
      style={{ maxWidth: "100%" }}
    >
      <defs>
        <clipPath id={clip}>
          <path d="M46 46 L54 132 L106 132 L114 46 Z" />
        </clipPath>
      </defs>
      <ellipse cx="80" cy="140" rx="46" ry="5" className="fill-bk-border" />
      <path d="M46 46 L54 132 L106 132 L114 46 Z" className="fill-bk-illo-bin-inner" />
      <g clipPath={`url(#${clip})`}>
        <rect x="40" y="116" width="80" height="20" className="fill-bk-illo-paper" />
        <rect x="56" y="124" width="14" height="6" rx="3" className="fill-bk-illo-can-red" />
        <rect x="73" y="124" width="14" height="6" rx="3" className="fill-bk-illo-can-blue" />
        <rect x="90" y="124" width="14" height="6" rx="3" className="fill-bk-illo-can-yellow" />
        <rect x="40" y="114" width="80" height="3" className="fill-bk-illo-cardboard" />
        <rect x="40" y="64" width="80" height="50" className="fill-bk-illo-organic" />
        <rect x="40" y="96" width="80" height="2" className="fill-bk-illo-cardboard-line" />
        <rect x="40" y="80" width="80" height="2" className="fill-bk-illo-cardboard-line" />
        <rect x="40" y="64" width="80" height="2" className="fill-bk-illo-cardboard-line" />
        <rect x="52" y="86" width="6" height="3" rx="1" className="fill-bk-illo-organic-leaf" />
        <circle cx="78" cy="72" r="2" className="fill-bk-illo-organic-peel" />
        <rect x="94" y="102" width="6" height="3" rx="1" className="fill-bk-illo-organic-green" />
        <circle cx="64" cy="106" r="1.6" className="fill-bk-illo-bran" />
      </g>
      <path
        d="M43 44 L51 134 L109 134 L117 44"
        fill="none"
        strokeWidth="5"
        strokeLinejoin="round"
        className="stroke-bk-illo-bin-wall"
      />
      <rect x="38" y="34" width="84" height="9" rx="4" className="fill-bk-primary" />
      <rect x="72" y="29" width="16" height="6" rx="2.5" className="fill-bk-primary-dark" />
      <path d="M104 34v-10" strokeWidth="2" strokeLinecap="round" className="stroke-bk-primary" />
      <path d="M104 24c0-9 6-15 15-15 0 9-6 15-15 15z" className="fill-bk-illo-organic-green" />
    </svg>
  );
}
