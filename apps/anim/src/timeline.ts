/**
 * Single source of truth for all timing constants across all 8 boards.
 * 60 fps, 270 frames per sub-step (4.5 s = SUBSTEP_MS = 4500 in apps/web/content/).
 */
export const FPS = 60;
export const SUBSTEP_SECONDS = 4.5;
export const SUBSTEP_FRAMES = 270; // 4.5 * 60
export const DEFAULT_BOARD_FRAMES = 810; // 3 * 270 = 13.5 s

export const COMP_WIDTH = 1920;
export const COMP_HEIGHT = 1080;

/**
 * Logical 320×280 board viewport mapped cleanly into 1920×1080:
 * 3.6× scale → 1152×1008 centered at (384, 36).
 * Also fits inside the centered 320:280 stage crop box (1234×1080 → x ∈ [343, 1577])
 * with ≥ 90 px horizontal safety margin and ≥ 50 px vertical safety margin.
 */
export const STAGE_VIEW = {
  width: 320,
  height: 280,
  scale: 3.45,
  offsetX: 408,
  offsetY: 57,
} as const;

export type BoardId =
  | "Step1"
  | "Step2"
  | "Step3"
  | "Faq1"
  | "Faq2"
  | "Faq3"
  | "Faq4"
  | "Faq5";

export interface BoardMeta {
  readonly id: BoardId;
  readonly filename: string;
  readonly substeps: number;
  readonly durationInFrames: number;
}

export const BOARDS: readonly BoardMeta[] = [
  { id: "Step1", filename: "step-1", substeps: 3, durationInFrames: 3 * SUBSTEP_FRAMES },
  { id: "Step2", filename: "step-2", substeps: 4, durationInFrames: 4 * SUBSTEP_FRAMES },
  { id: "Step3", filename: "step-3", substeps: 3, durationInFrames: 3 * SUBSTEP_FRAMES },
  { id: "Faq1", filename: "faq-1", substeps: 4, durationInFrames: 4 * SUBSTEP_FRAMES },
  { id: "Faq2", filename: "faq-2", substeps: 3, durationInFrames: 3 * SUBSTEP_FRAMES },
  { id: "Faq3", filename: "faq-3", substeps: 3, durationInFrames: 3 * SUBSTEP_FRAMES },
  { id: "Faq4", filename: "faq-4", substeps: 2, durationInFrames: 2 * SUBSTEP_FRAMES },
  { id: "Faq5", filename: "faq-5", substeps: 3, durationInFrames: 3 * SUBSTEP_FRAMES },
] as const;

/** Local frame inside a 0-based sub-step (returns < 0 before, >= 270 after). */
export function localFrame(frame: number, substepIndex: number): number {
  return frame - substepIndex * SUBSTEP_FRAMES;
}

/** Clamped local frame within [0, SUBSTEP_FRAMES]. */
export function substepClock(frame: number, substepIndex: number): number {
  return Math.max(0, Math.min(SUBSTEP_FRAMES, frame - substepIndex * SUBSTEP_FRAMES));
}

export const S0 = 0;
export const S1 = SUBSTEP_FRAMES; // 270
export const S2 = 2 * SUBSTEP_FRAMES; // 540
export const S3 = 3 * SUBSTEP_FRAMES; // 810

/** Per-board milestone frames (in local sub-step frames 0..269 unless noted). */
export const STEP1_TL = {
  canRow0Start: 12,
  canStagger: 12,
  canFallDur: 34,
  canRow1Start: 78,
  canSettleDone: 175,

  paperStart: 16,
  paperStagger: 9,
  paperFallDur: 30,
  paperLayerFadeStart: 24,
  paperLayerFadeEnd: 175,
  cartonHintIn: 175,
  cartonHintOut: 256,

  cartonEnter: 12,
  cartonAnticipationEnd: 32,
  cartonImpact: 92,
  cartonSettleEnd: 132,
} as const;

export const STEP2_TL = {
  squeezeStart: 8,
  squeezeEnd: 65,
  scrapStart: 20,
  scrapStagger: 6,
  scrapFallDur: 40,
  moundBuildStart: 38,
  moundBuildEnd: 190,

  spreaderEnter: 8,
  spreaderStart: 32,
  spreaderEnd: 156,
  spreaderExit: 205,

  bottleEnter: 0,
  bottleReady: 28,
  shakeStart: 28,
  shakeEnd: 196,
  bottleExitStart: 205,
  bottleExitEnd: 246,

  pressEnter: 0,
  pressReady: 26,
  press1Down: 48,
  press1Up: 86,
  press2Down: 112,
  press2HoldEnd: 155,
  pressExitStart: 162,
  pressExitEnd: 210,
  nextLayerSlotStart: 204,
} as const;

export const STEP3_TL = {
  sheetEnter: 14,
  sheetImpact: 125,
  sheetSettleEnd: 168,

  handEnter: 6,
  handPress: 26,
  sweepStart: 34,
  sweepEnd: 175,
  handExit: 220,

  lidAnticipationStart: 10,
  lidDropStart: 26,
  lidImpact: 82,
  lidSettleEnd: 135,
} as const;

export const FAQ1_TL = {
  lidOpenStart: 6,
  lidOpenEnd: 62,
  bagFlipStart: 18,
  bagFlipEnd: 88,

  spoonEnter: 0,
  spoonReady: 28,
  pour1Start: 30,
  pour2Start: 84,
  pour3Start: 138,
  spoonExitStart: 196,
  spoonExitEnd: 242,

  pressEnter: 0,
  press1Down: 44,
  press1Up: 82,
  press2Down: 108,
  press2HoldEnd: 152,
  pressExitEnd: 208,

  bagCloseStart: 10,
  bagCloseEnd: 80,
  smoothStart: 82,
  smoothEnd: 158,
  lidCloseStart: 162,
  lidCloseImpact: 212,
  lidCloseEnd: 242,
} as const;

export const FAQ2_TL = {
  maggotActiveEnd: 175,
  emSprinkleStart: 48,
  emSprinkleEnd: 188,
  emCoverDone: 188,

  handEnter: 8,
  smoothStart: 28,
  smoothEnd: 170,
  handExit: 220,

  lidAnticipationStart: 8,
  lidDropStart: 26,
  lidImpact: 80,
  lidSettleEnd: 125,
  flyFleeStart: 95,
  flyFleeEnd: 210,
} as const;

export const FAQ3_TL = {
  lidOpenEnd: 46,
  seepStart: 16,
  levelRiseEnd: 190,
  highlightIn: 145,

  camPanEnd: 22,
  bucketInEnd: 28,
  lidDropReady: 30,
  tiltStart: 24,
  tiltPeak: 80,
  pourStart: 68,
  pourEnd: 244,
  fillEnd: 242,

  untiltStart: 0,
  untiltEnd: 58,
  camReturnEnd: 62,
  bucketOutEnd: 78,
  canEnterStart: 44,
  canEnterEnd: 92,
  waterPourStart: 88,
  waterPourEnd: 222,
} as const;

export const FAQ4_TL = {
  transitionFrames: 24,
  moldGrowStart: 22,
  moldGrowEnd: 175,

  pressStart: 28,
  pressEnd: 158,
  bubbleEscapeEnd: 172,
} as const;

export const FAQ5_TL = {
  transitionFrames: 24,

  aTiltStart: 16,
  aTiltPeak: 96,
  aScrapsStart: 48,
  aScrapsEnd: 188,
  aSproutStart: 118,
  aSproutEnd: 225,

  bBagCrouchStart: 22,
  bBagJumpStart: 44,
  bBagLand: 138,
  bLidOpenStart: 58,
  bLidCloseEnd: 182,

  cCanTiltStart: 20,
  cCanTiltPeak: 58,
  cPourStart: 46,
  cPourEnd: 196,
  cCanReturnEnd: 235,
} as const;
