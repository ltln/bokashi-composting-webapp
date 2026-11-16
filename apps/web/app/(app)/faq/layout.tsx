import { FaqRail } from "@/components/faq";
import { faqs } from "@/content/faqs";

// Tab 2 frame. Below 1024 px it renders the page alone. From 1024 px it adds the
// list rail on the left (DeskFaq), so the detail on the right changes while the
// rail stays put. 24px 32px 40px lines up with the header's gutter.
export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex lg:flex-wrap lg:items-start lg:gap-6 lg:px-8 lg:pb-10 lg:pt-6">
      <FaqRail faqs={faqs} />
      <div className="min-w-0 lg:flex-[999_1_640px]">{children}</div>
    </div>
  );
}
