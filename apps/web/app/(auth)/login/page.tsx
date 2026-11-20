import type { Metadata } from "next";
import { LoginView } from "@/components/auth";
import { loginCopy } from "@/content/auth";

// Never call track() on this page: the login screen is not tracked.
export const metadata: Metadata = { title: loginCopy.pageTitle };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginView error={error} />;
}
