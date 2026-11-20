"use client";

import { useEffect } from "react";
import { AnimationStage, PlayerControls, useAnimationPlayer } from "@/components/player";
import { Pill } from "@/components/ui";
import { getSetupMedia } from "@/content/media";
import { getPlayerCopy, getSetupPageCopy, getSetupStep, getSetupSteps } from "@/content/setupSteps";
import type { SetupStep, SetupStepNumber } from "@/content/types";
import { useLocale, type Locale } from "@/lib/i18n";
import { track } from "@/lib/tracking";
import { useVoiceMuted } from "@/lib/voice";
import { DeskStepList } from "./DeskStepList";
import { SetupChecklist } from "./SetupChecklist";
import { StepSwitcher } from "./StepSwitcher";

/**
 * Tab 1 content for one step: tracks `view_3d_step` once per step, and keys
 * the inner player by `locale` so switching languages cleanly restarts video
 * & VO durations without re-firing analytics.
 */
export function SetupStepView({ step }: { step: SetupStep }) {
  const { locale } = useLocale();

  useEffect(() => {
    track("view_3d_step", step.featureTarget);
  }, [step.featureTarget]);

  return <SetupStepPlayer key={locale} stepNumber={step.number} locale={locale} />;
}

function SetupStepPlayer({ stepNumber, locale }: { stepNumber: SetupStepNumber; locale: Locale }) {
  const localizedSteps = getSetupSteps(locale);
  const localizedStep = getSetupStep(stepNumber, locale);
  const pageCopy = getSetupPageCopy(locale);
  const pCopy = getPlayerCopy(locale);
  const media = getSetupMedia(stepNumber, locale);
  const { muted: voiceMuted, setVoiceMuted, toggleVoiceMuted } = useVoiceMuted();

  const durationsMs = localizedStep.substeps.map((s) => s.durationMs);
  const player = useAnimationPlayer(durationsMs);
  const total = localizedSteps.length;
  const effectiveMuted = !media.hasAudio || voiceMuted;

  return (
    <main className="flex flex-col pt-1 lg:flex-row lg:flex-wrap lg:items-start lg:gap-6 lg:px-8 lg:pb-10 lg:pt-6">
      <AnimationStage
        label={pageCopy.stageLabel(localizedStep.number)}
        caption={localizedStep.substeps[player.active]?.caption ?? ""}
        paused={!player.playing}
        videoSrc={media.src}
        posterSrc={media.poster}
        illustrationLabel={localizedStep.illustrationLabel}
        active={player.active}
        epoch={player.epoch}
        reducedMotion={player.reducedMotion}
        substepDurationsMs={durationsMs}
        muted={effectiveMuted}
        onAutoplayMuted={() => setVoiceMuted(true)}
        className="lg:flex-[999_1_640px]"
        badgeStart={
          <Pill className="lg:px-3 lg:py-1.5 lg:text-[13px]">
            {pageCopy.stageChip(localizedStep, total)}
            {localizedStep.stageTag && <span className="hidden lg:inline"> · {localizedStep.stageTag}</span>}
          </Pill>
        }
        badgeEnd={
          <>
            {localizedStep.stageTag && <Pill tone="primary" className="lg:hidden">{localizedStep.stageTag}</Pill>}
            <span className="hidden text-[13px] text-bk-illo-label lg:inline">{pageCopy.desk.crossSection}</span>
          </>
        }
        controls={
          <PlayerControls
            total={localizedStep.substeps.length}
            active={player.active}
            progress={player.displayProgress}
            playing={player.playing}
            onTogglePlay={player.toggle}
            onReplay={player.replay}
            muted={effectiveMuted}
            onToggleMute={media.hasAudio ? toggleVoiceMuted : undefined}
            onSelect={player.reducedMotion ? player.goTo : undefined}
            captions={localizedStep.substeps.map((s) => s.caption)}
            labels={pCopy}
          />
        }
      />

      <StepSwitcher steps={localizedSteps} current={localizedStep.number} />
      <SetupChecklist step={localizedStep} active={player.active} />
      <DeskStepList steps={localizedSteps} step={localizedStep} active={player.active} />
    </main>
  );
}
