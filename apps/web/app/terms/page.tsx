import type { Metadata } from "next";
import { LegalPage } from "@/components/shell/LegalPage";
import { legal } from "@/content/legal";

export const metadata: Metadata = { title: legal.terms.title, description: legal.terms.description };

export default function TermsPage() {
  return <LegalPage page="terms" />;
}
