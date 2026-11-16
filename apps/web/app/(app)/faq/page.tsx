import type { Metadata } from "next";
import { FaqListView } from "@/components/faq";
import { faqPageCopy, faqs } from "@/content/faqs";

export const metadata: Metadata = { title: faqPageCopy.listMetaTitle };

export default function FaqListPage() {
  return (
    <main>
      <FaqListView faqs={faqs} />
      {/* Desktop: the rail in the layout is the list; the right side invites a pick. */}
      <p className="m-0 hidden rounded-[28px] bg-bk-surface-tint p-8 text-base text-bk-illo-label lg:block">
        {faqPageCopy.list.emptyDetail}
      </p>
    </main>
  );
}
