import type { Metadata } from "next";
import { FaqEmptyDetail, FaqListView } from "@/components/faq";
import { faqPageCopy, faqs } from "@/content/faqs";

export const metadata: Metadata = { title: faqPageCopy.listMetaTitle };

export default function FaqListPage() {
  return (
    <main>
      <FaqListView faqs={faqs} />
      {/* Desktop: the rail in the layout is the list; the right side invites a pick. */}
      <FaqEmptyDetail />
    </main>
  );
}
