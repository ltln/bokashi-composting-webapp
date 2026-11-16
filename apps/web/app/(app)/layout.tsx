// Authenticated app shell for /setup/* and /faq/*.
// M0: pass-through. M2 adds Header + BottomNav/DesktopNav, M1 the session
// check, M5 the one-time page_view tracker.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
