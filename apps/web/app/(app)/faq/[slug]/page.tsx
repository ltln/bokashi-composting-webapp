import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqDetail } from "@/components/faq";
import { faqPageCopy, getFaq } from "@/content/faqs";
import { FAQ_SLUGS, type FaqSlug } from "@/content/types";

// Only the 5 known slugs exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return FAQ_SLUGS.map((slug) => ({ slug }));
}

function parseSlug(raw: string): FaqSlug | null {
  return (FAQ_SLUGS as readonly string[]).includes(raw) ? (raw as FaqSlug) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = parseSlug((await params).slug);
  return slug ? { title: faqPageCopy.metaTitle(getFaq(slug)) } : {};
}

export default async function FaqDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = parseSlug((await params).slug);
  if (!slug) notFound();
  const faq = getFaq(slug);
  return <FaqDetail key={faq.slug} faq={faq} />;
}
