import type { Metadata } from "next";
import { placeholders } from "@/content/placeholders";

export const metadata: Metadata = { title: placeholders.faqList };

// Placeholder (M0). M4 builds the FAQ list.
export default function FaqListPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.faqList}</h1>
    </main>
  );
}
