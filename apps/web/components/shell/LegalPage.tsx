import Link from "next/link";
import { legal, type LegalPageContent } from "@/content/legal";
import { site } from "@/content/site";
import { LogoMark } from "./icons";

/** Static legal page (/terms, /privacy). Outside the (app) shell, so no tracking. */
export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex min-h-touch items-center gap-2.5 rounded-bk-sm text-bk-ink no-underline hover:text-bk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
      >
        <LogoMark className="size-8 flex-none" />
        <span className="text-base font-bold">{site.name}</span>
        <span className="sr-only">: {legal.backHome}</span>
      </Link>

      <article className="rounded-bk-card border border-bk-border bg-bk-surface p-5 md:p-8">
        <p role="note" className="mb-4 rounded-bk-sm bg-bk-accent-tint px-3 py-2 text-sm font-semibold text-bk-accent-dark">
          {legal.draftNotice}
        </p>
        <h1 className="text-2xl font-bold leading-tight">{content.title}</h1>
        <p className="mt-1 text-sm text-bk-muted">
          {legal.updatedLabel} {content.updated}
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
