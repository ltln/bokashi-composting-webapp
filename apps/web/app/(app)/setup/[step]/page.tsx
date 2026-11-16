import { placeholders } from "@/content/placeholders";
import { SETUP_STEP_NUMBERS } from "@/content/types";

// Only /setup/1..3 exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SETUP_STEP_NUMBERS.map((n) => ({ step: String(n) }));
}

// Placeholder (M0). M3 builds the step player.
export default async function SetupStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{placeholders.setupStep(Number(step))}</h1>
    </main>
  );
}
