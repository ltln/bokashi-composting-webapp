import type { Metadata } from "next";
import { placeholders } from "@/content/placeholders";

export const metadata: Metadata = { title: placeholders.terms };

// Placeholder (M0). Static legal page, filled in M7.
export default function TermsPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.terms}</h1>
    </main>
  );
}
