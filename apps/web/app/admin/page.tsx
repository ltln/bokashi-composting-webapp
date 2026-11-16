import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMe } from "@/components/auth/session";
import { placeholders } from "@/content/placeholders";

export const metadata: Metadata = { title: placeholders.admin };

// Placeholder body (M6 builds the dashboard). Non-admins get a 404; the Go API
// re-checks is_admin from the DB on every /api/admin/* call.
export default async function AdminPage() {
  const me = await getMe();
  if (!me?.isAdmin) notFound();
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.admin}</h1>
    </main>
  );
}
