"use client";

import { useEffect } from "react";
import { AnimationStage, PlayerControls, useAnimationPlayer } from "@/components/player";
import { Step1, Step2, Step3 } from "@/components/illustrations/setup";
import { Pill } from "@/components/ui";
import { track } from "@/lib/tracking";
import { playerCopy, setupPageCopy, setupSteps } from "@/content/setupSteps";
import type { SetupStep } from "@/content/types";
import { DeskStepList } from "./DeskStepList";
import { SetupChecklist } from "./SetupChecklist";
import { StepSwitcher } from "./StepSwitcher";

const ILLUSTRATIONS = { 1: Step1, 2: Step2, 3: Step3 } as const;

/**
 * Tab 1 content for one step: stage + controls, mobile switcher + checklist
 * card, desktop step list. Render with `key={step.number}` so the player
 * restarts when the step changes.
 */
export function SetupStepView({ step }: { step: SetupStep }) {
  const player = useAnimationPlayer(step.substeps.map((s) => s.durationMs));
  const total = setupSteps.length;
  const Illustration = ILLUSTRATIONS[step.number];

  useEffect(() => {
    track("view_3d_step", step.featureTarget);
  }, [step.featureTarget]);

  return (
    <main className="flex flex-col pt-1 lg:flex-row lg:flex-wrap lg:items-start lg:gap-6 lg:px-8 lg:pb-10 lg:pt-6">
      <AnimationStage
        label={setupPageCopy.stageLabel(step.number)}
        caption={step.substeps[player.active]?.caption ?? ""}
        paused={!player.playing}
        className="lg:flex-[999_1_640px]"
        badgeStart={
          <Pill className="lg:px-3 lg:py-1.5 lg:text-[13px]">
            {setupPageCopy.stageChip(step, total)}
            {step.stageTag && <span className="hidden lg:inline"> · {step.stageTag}</span>}
          </Pill>
        }
        badgeEnd={
          <>
            {step.stageTag && <Pill tone="primary" className="lg:hidden">{step.stageTag}</Pill>}
            <span className="hidden text-[13px] text-bk-illo-label lg:inline">{setupPageCopy.desk.crossSection}</span>
          </>
        }
        controls={
          <PlayerControls
            total={step.substeps.length}
            active={player.active}
            progress={player.displayProgress}
            playing={player.playing}
            onTogglePlay={player.toggle}
            onReplay={player.replay}
            onSelect={player.reducedMotion ? player.goTo : undefined}
            captions={step.substeps.map((s) => s.caption)}
            labels={playerCopy}
          />
        }
      >
        <Illustration key={player.epoch} active={player.active} paused={!player.playing} label={step.illustrationLabel} />
      </AnimationStage>

      <StepSwitcher steps={setupSteps} current={step.number} />
      <SetupChecklist step={step} active={player.active} />
      <DeskStepList steps={setupSteps} step={step} active={player.active} />
    </main>
  );
}
