import { AppHeader } from "@/components/shell/AppHeader";
import { NavTabs } from "@/components/shell/NavTabs";
import { PageViewTracker } from "@/components/shell/PageViewTracker";

// Authenticated app shell for /setup/* and /faq/*: header, desktop top-bar tabs,
// mobile bottom nav and the one-time page_view tracker. M1 adds the session check.
// Pages render their own <main> and padding (desktop boards: 24px 32px 40px, which
// lines up with the header's 32 px gutter); this wrapper only caps the width at
// 1280 px and keeps content clear of the fixed bottom nav (76 px + safe area) on mobile.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewTracker />
      <AppHeader />
      <div className="mx-auto w-full max-w-[1280px] pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      <NavTabs variant="bottom" />
    </>
  );
}
