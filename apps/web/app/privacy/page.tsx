import type { Metadata } from "next";
import { LegalPage } from "@/components/shell/LegalPage";
import { legal } from "@/content/legal";

export const metadata: Metadata = { title: legal.privacy.title, description: legal.privacy.description };

export default function PrivacyPage() {
  return <LegalPage content={legal.privacy} />;
}
