"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimationStage, PlayerControls, useAnimationPlayer } from "@/components/player";
import type { AnimationPlayer } from "@/components/player";
import { IconButton, Pill } from "@/components/ui";
import { cn } from "@/lib/cn";
import { track } from "@/lib/tracking";
import { faqPageCopy, faqs, getFaqNeighbours } from "@/content/faqs";
import { playerCopy } from "@/content/setupSteps";
import type { Faq, FaqSlug } from "@/content/types";
import { FaqChecklist } from "./FaqChecklist";
import { ArrowRight, ChevronLeft } from "./icons";
import { FAQ_TINT } from "./tints";

const FAQ_VIDEOS: Record<FaqSlug, { src: string; poster: string }> = {
  smell: { src: "/animations/faq-1.mp4", poster: "/animations/faq-1-poster.png" },
  maggots: { src: "/animations/faq-2.mp4", poster: "/animations/faq-2-poster.png" },
  liquid: { src: "/animations/faq-3.mp4", poster: "/animations/faq-3-poster.png" },
  mold: { src: "/animations/faq-4.mp4", poster: "/animations/faq-4-poster.png" },
  disposal: { src: "/animations/faq-5.mp4", poster: "/animations/faq-5-poster.png" },
};

/** Tab 2 detail for one FAQ. Render with `key={faq.slug}` so the player restarts. */
export function FaqDetail({ faq }: { faq: Faq }) {
  const player = useAnimationPlayer(faq.substeps.map((s) => s.durationMs));
  const { prev, next } = getFaqNeighbours(faq.slug);
  const tint = FAQ_TINT[faq.tint];
  const d = faqPageCopy.detail;
  const total = faqs.length;
  const compare = faq.options !== undefined;
  const media = FAQ_VIDEOS[faq.slug];

  useEffect(() => {
    track("click_faq_3d", faq.featureTarget);
  }, [faq.featureTarget]);

  const categoryPill = (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tint.bg, tint.fg)}>{faq.category}</span>
  );

  return (
    <main className="flex flex-col gap-2.5 lg:gap-4">
      {/* Mobile top bar (Faq boards) */}
      <div className="flex h-14 items-center gap-1 pl-1 pr-4 lg:hidden">
        <Link
          href="/faq"
          aria-label={d.back}
          className="flex size-touch items-center justify-center rounded-full text-bk-ink hover:text-bk-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-bk-accent"
        >
          <ChevronLeft size={22} />
        </Link>
        <span className="flex-1 text-[15px] font-semibold">{d.counter(faq.number, total)}</span>
        {categoryPill}
      </div>

      <div className="flex flex-col gap-2 px-4 lg:px-0">
        {/* Desktop counter row (DeskFaq) */}
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-[13px] font-semibold text-bk-illo-label">{d.counter(faq.number, total)}</span>
          {categoryPill}
        </div>
        <h1 className="m-0 text-[19px] font-bold leading-[25px] lg:text-2xl lg:leading-[31px]">{faq.question}</h1>
      </div>

      <AnimationStage
        size={compare ? "faqCompare" : "faq"}
        label={faq.stageLabel}
        caption={faq.substeps[player.active]?.caption ?? ""}
        paused={!player.playing}
        videoSrc={media.src}
        posterSrc={media.poster}
        illustrationLabel={faq.illustrationLabel}
        active={player.active}
        epoch={player.epoch}
        reducedMotion={player.reducedMotion}
        badgeEnd={faq.stageBadge && <StageBadge from={faq.stageBadge.from} to={faq.stageBadge.to} />}
        controls={
          compare && faq.options ? (
            <CompareControls faq={faq} player={player} />
          ) : (
            <PlayerControls
              total={faq.substeps.length}
              active={player.active}
              progress={player.displayProgress}
              playing={player.playing}
              onTogglePlay={player.toggle}
              onReplay={player.replay}
              onSelect={player.reducedMotion ? player.goTo : undefined}
              captions={faq.substeps.map((s) => s.caption)}
              labels={playerCopy}
            />
          )
        }
      />

      <FaqChecklist faq={faq} active={player.active} prev={prev} next={next} />
    </main>
  );
}

/** "Thối → Chua nhẹ" chip at the stage's top right (Faq1 board). */
function StageBadge({ from, to }: { from: string; to: string }) {
  return (
    <Pill className="gap-1.5 px-2.5 py-[5px] text-xs lg:px-3 lg:py-1.5 lg:text-[13px]">
      <span className="text-bk-olive">{from}</span>
      <ArrowRight className="text-bk-muted" />
      <span className="text-bk-primary-dark">{to}</span>
    </Pill>
  );
}

/**
 * Controls of the compare FAQs (4, 5): play/pause, a two-way toggle that
 * emphasises one state, and replay. The toggle replaces the segmented bar.
 */
function CompareControls({ faq, player }: { faq: Faq; player: AnimationPlayer }) {
  return (
    <div className="flex h-[60px] items-center gap-3 px-4 py-2 lg:h-auto lg:gap-3.5 lg:p-0">
      <IconButton
        variant="primary"
        aria-label={player.playing ? playerCopy.pause : playerCopy.play}
        onClick={player.toggle}
        className="lg:size-12"
      >
        {player.playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" />
          </svg>
        )}
      </IconButton>
      <div
        role="group"
        aria-label={faqPageCopy.detail.toggleLabel[faq.slug]}
        className="box-border flex flex-1 gap-[3px] rounded-bk-sm border border-bk-border bg-bk-surface p-[3px]"
      >
        {faq.options?.map((o, i) => {
          const pressed = i === player.active;
          return (
            <button
              key={o.toggleLabel}
              type="button"
              aria-pressed={pressed}
              onClick={() => player.goTo(i)}
              className={cn(
                "min-h-[38px] flex-1 rounded-[9px] border-0 text-[13px] font-semibold",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary",
                pressed ? "bg-bk-primary text-white" : "bg-transparent text-bk-ink",
              )}
            >
              {o.toggleLabel}
            </button>
          );
        })}
      </div>
      <IconButton variant="outline" aria-label={playerCopy.replay} onClick={player.replay} className="lg:size-12 lg:border-bk-input-border">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </IconButton>
    </div>
  );
}
