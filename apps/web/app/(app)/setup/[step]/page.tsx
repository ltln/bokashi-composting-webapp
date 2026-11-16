import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupStepView } from "@/components/setup";
import { getSetupStep, setupPageCopy } from "@/content/setupSteps";
import { SETUP_STEP_NUMBERS, type SetupStepNumber } from "@/content/types";

// Only /setup/1..3 exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SETUP_STEP_NUMBERS.map((n) => ({ step: String(n) }));
}

function parseStep(raw: string): SetupStepNumber | null {
  const n = Number(raw);
  return (SETUP_STEP_NUMBERS as readonly number[]).includes(n) ? (n as SetupStepNumber) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const n = parseStep((await params).step);
  return n ? { title: setupPageCopy.metaTitle(getSetupStep(n)) } : {};
}

export default async function SetupStepPage({ params }: { params: Promise<{ step: string }> }) {
  const n = parseStep((await params).step);
  if (!n) notFound();
  const step = getSetupStep(n);
  return <SetupStepView key={n} step={step} />;
}
