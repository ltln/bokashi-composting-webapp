"use client";

import Link from "next/link";
import { getLoginCopy } from "@/content/auth";
import { useLocale } from "@/lib/i18n";

export function LegalLine({ className }: { className: string }) {
  const { locale } = useLocale();
  const l = getLoginCopy(locale).legal;

  return (
    <p className={`m-0 text-bk-muted ${className}`}>
      {l.before}
      <Link href="/terms" className="underline">{l.terms}</Link>
      {l.between}
      <Link href="/privacy" className="underline">{l.privacy}</Link>
      {l.after}
    </p>
  );
}
