import type { Metadata } from "next";
import { placeholders } from "@/content/placeholders";

export const metadata: Metadata = { title: placeholders.privacy };

// Placeholder (M0). Static legal page explaining anonymous tracking, filled in M7.
export default function PrivacyPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.privacy}</h1>
    </main>
  );
}
