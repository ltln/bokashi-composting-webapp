import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin";
import { getMe } from "@/components/auth/session";
import { admin } from "@/content/admin";

export const metadata: Metadata = { title: admin.pageTitle };

// Outside the (app) layout on purpose: no page_view tracker and no app shell here.
// Non-admins get a 404; the Go API re-checks is_admin from the DB on every /api/admin/* call.
export default async function AdminPage() {
  const me = await getMe();
  if (!me?.isAdmin) notFound();
  return <AdminDashboard />;
}
