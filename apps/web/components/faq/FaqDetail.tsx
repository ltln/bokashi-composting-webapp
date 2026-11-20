"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimationStage, PlayerControls, useAnimationPlayer } from "@/components/player";
import type { AnimationPlayer } from "@/components/player";
import { VoiceMuteButton } from "@/components/player/PlayerControls";
import { IconButton, Pill } from "@/components/ui";
import { getFaq, getFaqNeighbours, getFaqPageCopy, getFaqs } from "@/content/faqs";
import { getFaqMedia } from "@/content/media";
import { getPlayerCopy, type PlayerCopy } from "@/content/setupSteps";
import type { Faq, FaqSlug } from "@/content/types";
import { cn } from "@/lib/cn";
import { useLocale, type Locale } from "@/lib/i18n";
import { track } from "@/lib/tracking";
import { useVoiceMuted } from "@/lib/voice";
import { FaqChecklist } from "./FaqChecklist";
import { ArrowRight, ChevronLeft } from "./icons";
import { FAQ_TINT } from "./tints";

/**
 * Tab 2 detail for one FAQ. Tracks `click_faq_3d` once per FAQ slug, and keys
 * the inner player by `locale` so language switching restarts video & VO cleanly
 * without re-firing analytics.
 */
export function FaqDetail({ faq }: { faq: Faq }) {
  const { locale } = useLocale();

  useEffect(() => {
    track("click_faq_3d", faq.featureTarget);
  }, [faq.featureTarget]);

  return <FaqDetailPlayer key={locale} slug={faq.slug} locale={locale} />;
}

function FaqDetailPlayer({ slug, locale }: { slug: FaqSlug; locale: Locale }) {
  const localizedFaq = getFaq(slug, locale);
  const { prev, next } = getFaqNeighbours(slug, locale);
  const pageCopy = getFaqPageCopy(locale);
  const pCopy = getPlayerCopy(locale);
  const media = getFaqMedia(slug, locale);
  const { muted: voiceMuted, setVoiceMuted, toggleVoiceMuted } = useVoiceMuted();

  const durationsMs = localizedFaq.substeps.map((s) => s.durationMs);
  const player = useAnimationPlayer(durationsMs);
  const tint = FAQ_TINT[localizedFaq.tint];
  const d = pageCopy.detail;
  const total = getFaqs(locale).length;
  const compare = localizedFaq.options !== undefined;
  const effectiveMuted = !media.hasAudio || voiceMuted;

  const categoryPill = (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tint.bg, tint.fg)}>{localizedFaq.category}</span>
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
        <span className="flex-1 text-[15px] font-semibold">{d.counter(localizedFaq.number, total)}</span>
        {categoryPill}
      </div>

      <div className="flex flex-col gap-2 px-4 lg:px-0">
        {/* Desktop counter row (DeskFaq) */}
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-[13px] font-semibold text-bk-illo-label">{d.counter(localizedFaq.number, total)}</span>
          {categoryPill}
        </div>
        <h1 className="m-0 text-[19px] font-bold leading-[25px] lg:text-2xl lg:leading-[31px]">{localizedFaq.question}</h1>
      </div>

      <AnimationStage
        size={compare ? "faqCompare" : "faq"}
        label={localizedFaq.stageLabel}
        caption={localizedFaq.substeps[player.active]?.caption ?? ""}
        paused={!player.playing}
        videoSrc={media.src}
        posterSrc={media.poster}
        illustrationLabel={localizedFaq.illustrationLabel}
        active={player.active}
        epoch={player.epoch}
        reducedMotion={player.reducedMotion}
        substepDurationsMs={durationsMs}
        muted={effectiveMuted}
        onAutoplayMuted={() => setVoiceMuted(true)}
        badgeEnd={localizedFaq.stageBadge && <StageBadge from={localizedFaq.stageBadge.from} to={localizedFaq.stageBadge.to} />}
        controls={
          compare && localizedFaq.options ? (
            <CompareControls
              faq={localizedFaq}
              player={player}
              playerCopy={pCopy}
              toggleLabel={d.toggleLabel[localizedFaq.slug]}
              muted={effectiveMuted}
              onToggleMute={media.hasAudio ? toggleVoiceMuted : undefined}
            />
          ) : (
            <PlayerControls
              total={localizedFaq.substeps.length}
              active={player.active}
              progress={player.displayProgress}
              playing={player.playing}
              onTogglePlay={player.toggle}
              onReplay={player.replay}
              muted={effectiveMuted}
              onToggleMute={media.hasAudio ? toggleVoiceMuted : undefined}
              onSelect={player.reducedMotion ? player.goTo : undefined}
              captions={localizedFaq.substeps.map((s) => s.caption)}
              labels={pCopy}
            />
          )
        }
      />

      <FaqChecklist faq={localizedFaq} active={player.active} prev={prev} next={next} />
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
 * emphasises one state, optional voice mute, and replay. The toggle replaces
 * the segmented bar.
 */
function CompareControls({
  faq,
  player,
  playerCopy,
  toggleLabel,
  muted,
  onToggleMute,
}: {
  faq: Faq;
  player: AnimationPlayer;
  playerCopy: PlayerCopy;
  toggleLabel?: string;
  muted: boolean;
  onToggleMute?: () => void;
}) {
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
        aria-label={toggleLabel}
        className="box-border flex flex-1 gap-[3px] rounded-bk-sm border border-bk-border bg-bk-surface p-[3px]"
      >
        {faq.options?.map((o, i) => {
          const pressed = i === player.active;
          return (
            <button
              key={faq.substeps[i]?.id ?? i}
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
      {onToggleMute && (
        <VoiceMuteButton
          muted={muted}
          onToggle={onToggleMute}
          muteLabel={playerCopy.mute}
          unmuteLabel={playerCopy.unmute}
        />
      )}
      <IconButton variant="outline" aria-label={playerCopy.replay} onClick={player.replay} className="lg:size-12 lg:border-bk-input-border">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </IconButton>
    </div>
  );
}
