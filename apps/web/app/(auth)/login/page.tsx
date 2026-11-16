import type { Metadata } from "next";
import { placeholders } from "@/content/placeholders";

// Placeholder (M0). M1 builds the login screen. Never call track() here.
export const metadata: Metadata = { title: placeholders.login };

export default function LoginPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.login}</h1>
    </main>
  );
}
