"use client";

import { getPlaceholders } from "@/content/placeholders";
import { useLocale } from "@/lib/i18n";

export default function NotFound() {
  const { locale } = useLocale();
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{getPlaceholders(locale).notFound}</h1>
    </main>
  );
}
