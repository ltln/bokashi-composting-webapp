"use client";

import Link from "next/link";
import { getLegal } from "@/content/legal";
import { getSite } from "@/content/site";
import { useLocale } from "@/lib/i18n";
import { LogoMark } from "./icons";
import { LanguageToggle } from "./LanguageToggle";

/** Static legal page (/terms, /privacy). Outside the (app) shell, so no tracking. */
export function LegalPage({ page }: { page: "terms" | "privacy" }) {
  const { locale } = useLocale();
  const legalCopy = getLegal(locale);
  const siteCopy = getSite(locale);
  const content = legalCopy[page];

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-touch min-w-0 items-center gap-2.5 rounded-bk-sm text-bk-ink no-underline hover:text-bk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
        >
          <LogoMark className="size-8 flex-none" />
          <span className="truncate text-base font-bold">{siteCopy.name}</span>
          <span className="sr-only">: {legalCopy.backHome}</span>
        </Link>
        <LanguageToggle />
      </div>

      <article className="rounded-bk-card border border-bk-border bg-bk-surface p-5 md:p-8">
        <p role="note" className="mb-4 rounded-bk-sm bg-bk-accent-tint px-3 py-2 text-sm font-semibold text-bk-accent-dark">
          {legalCopy.draftNotice}
        </p>
        <h1 className="text-2xl font-bold leading-tight">{content.title}</h1>
        <p className="mt-1 text-sm text-bk-muted">
          {legalCopy.updatedLabel} {content.updated}
        </p>
        {content.sections.map((section) => (
          <section key={section.heading} className="mt-6">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.paragraphs.map((p) => (
              <p key={p} className="mt-2 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
