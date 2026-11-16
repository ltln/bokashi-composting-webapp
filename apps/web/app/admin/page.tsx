import type { Metadata } from "next";
import { placeholders } from "@/content/placeholders";

export const metadata: Metadata = { title: placeholders.admin };

// Placeholder (M0). M6 builds the dashboard; M1 makes it 404 for non-admins.
export default function AdminPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.admin}</h1>
    </main>
  );
}
