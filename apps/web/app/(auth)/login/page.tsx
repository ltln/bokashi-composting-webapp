import type { Metadata } from "next";
import { GoogleButton, LegalLine, LoginError, LoginHero, Logo } from "@/components/auth";
import { loginCopy } from "@/content/auth";

// Never call track() on this page: the login screen is not tracked.
export const metadata: Metadata = { title: loginCopy.pageTitle };

const featureIcons = [
  <>
    <path d="M4 7h16l-1.6 12.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z" />
    <path d="M3 4h18v3H3z" />
  </>,
  <polygon key="p" points="6 4 20 12 6 20 6 4" />,
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
    <path d="M12 17h.01" />
  </>,
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="bg-motif flex min-h-screen flex-col bg-bk-ground text-bk-ink lg:flex-row lg:flex-wrap">
      {/* Mobile board */}
      <div className="flex flex-1 flex-col lg:hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-7 px-7 pt-8">
          <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full bg-bk-surface-tint">
            <LoginHero size={150} idPrefix="lg" />
          </div>
          <div className="flex flex-col items-center gap-2.5 text-center">
            <Logo size={28} textClass="text-[15px]" />
            <h1 className="m-0 text-[26px] font-bold leading-[33px]">{loginCopy.heading}</h1>
            <p className="m-0 text-[15px] leading-[22px] text-bk-muted">{loginCopy.subtext}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3.5 px-6 pb-9 pt-6">
          <LoginError code={error} />
          <GoogleButton className="h-[52px] text-base" />
          <LegalLine className="text-center text-xs leading-[18px]" />
        </div>
      </div>

      {/* Desktop board */}
      <section className="hidden min-w-0 flex-[1_1_520px] flex-col items-center justify-center gap-8 bg-bk-surface-tint px-10 py-14 lg:flex">
        <LoginHero size={320} idPrefix="dl" />
        <ul className="m-0 flex max-w-[420px] list-none flex-col gap-3.5 p-0">
          {loginCopy.features.map((f, i) => (
            <li key={f} className="flex items-start gap-3 text-[15px] leading-[22px]">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-bk-surface text-bk-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {featureIcons[i]}
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>
      </section>
      <section className="hidden min-w-0 flex-[1_1_520px] items-center justify-center px-10 py-14 lg:flex">
        <div className="flex w-full max-w-[420px] flex-col gap-7">
          <Logo size={40} textClass="text-lg" />
          <div className="flex flex-col gap-3">
            <h2 className="m-0 text-[40px] font-bold leading-[48px]">{loginCopy.heading}</h2>
            <p className="m-0 text-[17px] leading-[26px] text-bk-muted">{loginCopy.subtextDesktop}</p>
          </div>
          <div className="flex flex-col gap-3.5">
            <LoginError code={error} />
            <GoogleButton className="h-14 text-base" />
            <LegalLine className="text-[13px] leading-[19px]" />
          </div>
        </div>
      </section>
    </main>
  );
}
