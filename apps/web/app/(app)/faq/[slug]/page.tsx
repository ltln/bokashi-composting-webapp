import { placeholders } from "@/content/placeholders";
import { FAQ_SLUGS, type FaqSlug } from "@/content/types";

// Only the 5 known slugs exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return FAQ_SLUGS.map((slug) => ({ slug }));
}

// Placeholder (M0). M4 builds the FAQ detail.
export default async function FaqDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = FAQ_SLUGS.indexOf(slug as FaqSlug) + 1;
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.faqDetail(n)}</h1>
    </main>
  );
}
