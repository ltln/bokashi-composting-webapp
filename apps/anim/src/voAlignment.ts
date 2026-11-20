import type { BoardId } from "./timeline";
import { SUBSTEP_FRAMES } from "./timeline";

export type BoardLocale = "vi" | "en";

export interface VoSubstepSchedule {
  readonly id: string;
  readonly audioFile: string;
  readonly audioDurationSec: number;
  readonly startFrame: number;
  readonly durationInFrames: number;
  /** Optional RMS-matching gain multiplier applied purely via Remotion `<Audio volume>`. */
  readonly gain?: number;
  /** Strictly increasing [realLocalFrame, canonicalLocalFrame] pairs covering [0, 0] → [durationInFrames, 270]. */
  readonly anchors: readonly (readonly [number, number])[];
}

export interface VoBoardSchedule {
  readonly boardId: BoardId;
  readonly filename: string;
  readonly totalFrames: number;
  readonly substeps: readonly VoSubstepSchedule[];
}

/**
 * Forced-alignment (wav2vec2-base-960h) VO schedules for English renders at 60 fps.
 * Source audio files are kept 100% untouched; animation milestones warp to follow VO onsets.
 */
export const EN_VO_SCHEDULES: Record<BoardId, VoBoardSchedule> = {
  Step1: {
    boardId: "Step1",
    filename: "step-1-en",
    totalFrames: 1087,
    substeps: [
      {
        id: "cans",
        audioFile: "step1-1-cans-en.mp3",
        audioDurationSec: 5.146,
        startFrame: 0,
        durationInFrames: 321,
        anchors: [
          [0, 0],
          [55, 12],
          [134, 78],
          [270, 175],
          [321, 270],
        ],
      },
      {
        id: "paper",
        audioFile: "step1-2-paper-en.mp3",
        audioDurationSec: 6.609,
        startFrame: 321,
        durationInFrames: 409,
        anchors: [
          [0, 0],
          [60, 16],
          [230, 145],
          [284, 175],
          [385, 256],
          [409, 270],
        ],
      },
      {
        id: "cardboard",
        audioFile: "step1-3-cardboard-en.mp3",
        audioDurationSec: 5.642,
        startFrame: 730,
        durationInFrames: 357,
        anchors: [
          [0, 0],
          [60, 12],
          [130, 32],
          [171, 92],
          [223, 132],
          [300, 220],
          [335, 265],
          [357, 270],
        ],
      },
    ],
  },
  Step2: {
    boardId: "Step2",
    filename: "step-2-en",
    totalFrames: 1241,
    substeps: [
      {
        id: "chop",
        audioFile: "step2-1-chop-en.mp3",
        audioDurationSec: 5.251,
        startFrame: 0,
        durationInFrames: 328,
        anchors: [
          [0, 0],
          [114, 16],
          [194, 48],
          [274, 155],
          [304, 210],
          [328, 270],
        ],
      },
      {
        id: "spread",
        audioFile: "step2-2-spread-en.mp3",
        audioDurationSec: 4.989,
        startFrame: 328,
        durationInFrames: 312,
        anchors: [
          [0, 0],
          [14, 8],
          [42, 32],
          [190, 156],
          [268, 205],
          [312, 270],
        ],
      },
      {
        id: "bran",
        audioFile: "step2-3-bran-en.mp3",
        audioDurationSec: 4.833,
        startFrame: 640,
        durationInFrames: 302,
        anchors: [
          [0, 0],
          [56, 28],
          [142, 108],
          [249, 196],
          [273, 246],
          [302, 270],
        ],
      },
      {
        id: "press",
        audioFile: "step2-4-press-en.mp3",
        audioDurationSec: 4.676,
        startFrame: 942,
        durationInFrames: 299,
        anchors: [
          [0, 0],
          [28, 36],
          [115, 112],
          [187, 195],
          [230, 210],
          [268, 245],
          [278, 268],
          [299, 270],
        ],
      },
    ],
  },
  Step3: {
    boardId: "Step3",
    filename: "step-3-en",
    totalFrames: 1012,
    substeps: [
      {
        id: "bag",
        audioFile: "step3-1-bag-en.mp3",
        audioDurationSec: 4.049,
        startFrame: 0,
        durationInFrames: 255,
        anchors: [
          [0, 0],
          [8, 14],
          [142, 125],
          [202, 168],
          [255, 270],
        ],
      },
      {
        id: "smooth",
        audioFile: "step3-2-smooth-en.mp3",
        audioDurationSec: 6.844,
        startFrame: 255,
        durationInFrames: 423,
        anchors: [
          [0, 0],
          [18, 6],
          [122, 34],
          [196, 102],
          [254, 118],
          [359, 175],
          [394, 220],
          [423, 270],
        ],
      },
      {
        id: "lid",
        audioFile: "step3-3-lid-en.mp3",
        audioDurationSec: 5.251,
        startFrame: 678,
        durationInFrames: 334,
        anchors: [
          [0, 0],
          [65, 10],
          [94, 26],
          [128, 82],
          [197, 135],
          [305, 265],
          [334, 270],
        ],
      },
    ],
  },
  Faq1: {
    boardId: "Faq1",
    filename: "faq-1-en",
    totalFrames: 1317,
    substeps: [
      {
        id: "open",
        audioFile: "faq1-1-open-en.mp3",
        audioDurationSec: 4.598,
        startFrame: 0,
        durationInFrames: 288,
        anchors: [
          [0, 0],
          [95, 6],
          [155, 42],
          [182, 58],
          [247, 88],
          [288, 270],
        ],
      },
      {
        id: "em",
        audioFile: "faq1-2-em-en.mp3",
        audioDurationSec: 6.844,
        startFrame: 288,
        durationInFrames: 423,
        anchors: [
          [0, 0],
          [44, 28],
          [109, 84],
          [193, 138],
          [305, 196],
          [386, 242],
          [423, 270],
        ],
      },
      {
        id: "press",
        audioFile: "faq1-3-press-en.mp3",
        audioDurationSec: 3.474,
        startFrame: 711,
        durationInFrames: 221,
        anchors: [
          [0, 0],
          [36, 34],
          [93, 54],
          [116, 108],
          [170, 152],
          [187, 208],
          [221, 270],
        ],
      },
      {
        id: "seal",
        audioFile: "faq1-4-seal-en.mp3",
        audioDurationSec: 6.113,
        startFrame: 932,
        durationInFrames: 385,
        anchors: [
          [0, 0],
          [12, 10],
          [70, 82],
          [145, 162],
          [195, 212],
          [230, 242],
          [355, 266],
          [385, 270],
        ],
      },
    ],
  },
  Faq2: {
    boardId: "Faq2",
    filename: "faq-2-en",
    totalFrames: 976,
    substeps: [
      {
        id: "cover",
        audioFile: "faq2-1-cover-en.mp3",
        audioDurationSec: 4.754,
        startFrame: 0,
        durationInFrames: 298,
        anchors: [
          [0, 0],
          [92, 34],
          [141, 48],
          [217, 145],
          [263, 215],
          [298, 270],
        ],
      },
      {
        id: "bag",
        audioFile: "faq2-2-bag-en.mp3",
        audioDurationSec: 5.799,
        startFrame: 298,
        durationInFrames: 360,
        anchors: [
          [0, 0],
          [53, 8],
          [112, 28],
          [237, 150],
          [311, 185],
          [334, 220],
          [360, 270],
        ],
      },
      {
        id: "lid",
        audioFile: "faq2-3-lid-en.mp3",
        audioDurationSec: 4.989,
        startFrame: 658,
        durationInFrames: 318,
        anchors: [
          [0, 0],
          [110, 26],
          [152, 80],
          [225, 95],
          [275, 210],
          [295, 265],
          [318, 270],
        ],
      },
    ],
  },
  Faq3: {
    boardId: "Faq3",
    filename: "faq-3-en",
    totalFrames: 1099,
    substeps: [
      {
        id: "check",
        audioFile: "faq3-1-check-en.mp3",
        audioDurationSec: 5.407,
        startFrame: 0,
        durationInFrames: 337,
        anchors: [
          [0, 0],
          [52, 46],
          [132, 108],
          [184, 155],
          [261, 190],
          [337, 270],
        ],
      },
      {
        id: "pour",
        audioFile: "faq3-2-pour-en.mp3",
        audioDurationSec: 6.922,
        startFrame: 337,
        durationInFrames: 428,
        anchors: [
          [0, 0],
          [54, 24],
          [181, 68],
          [383, 242],
          [403, 255],
          [428, 270],
        ],
      },
      {
        id: "water",
        audioFile: "faq3-3-water-en.mp3",
        audioDurationSec: 5.251,
        startFrame: 765,
        durationInFrames: 334,
        anchors: [
          [0, 0],
          [92, 58],
          [165, 88],
          [268, 210],
          [297, 244],
          [310, 266],
          [334, 270],
        ],
      },
    ],
  },
  Faq4: {
    boardId: "Faq4",
    filename: "faq-4-en",
    totalFrames: 833,
    substeps: [
      {
        id: "white",
        audioFile: "faq4-1-white-en.mp3",
        audioDurationSec: 6.609,
        startFrame: 0,
        durationInFrames: 409,
        anchors: [
          [0, 0],
          [66, 22],
          [284, 150],
          [380, 245],
          [409, 270],
        ],
      },
      {
        id: "dark",
        audioFile: "faq4-2-dark-en.mp3",
        audioDurationSec: 6.766,
        startFrame: 409,
        durationInFrames: 424,
        anchors: [
          [0, 0],
          [47, 24],
          [264, 28],
          [350, 140],
          [393, 244],
          [402, 266],
          [424, 270],
        ],
      },
    ],
  },
  Faq5: {
    boardId: "Faq5",
    filename: "faq-5-en",
    totalFrames: 1129,
    substeps: [
      {
        id: "plant",
        audioFile: "faq5-1-plant-en.mp3",
        audioDurationSec: 6.191,
        startFrame: 0,
        durationInFrames: 384,
        anchors: [
          [0, 0],
          [88, 16],
          [144, 48],
          [229, 118],
          [328, 225],
          [384, 270],
        ],
      },
      {
        id: "bin",
        audioFile: "faq5-2-bin-en.mp3",
        audioDurationSec: 6.348,
        startFrame: 384,
        durationInFrames: 393,
        anchors: [
          [0, 0],
          [41, 22],
          [178, 28],
          [267, 44],
          [343, 138],
          [369, 182],
          [393, 270],
        ],
      },
      {
        id: "juice",
        audioFile: "faq5-3-juice-en.mp3",
        audioDurationSec: 5.564,
        startFrame: 777,
        durationInFrames: 352,
        anchors: [
          [0, 0],
          [62, 24],
          [112, 46],
          [286, 196],
          [325, 244],
          [330, 266],
          [352, 270],
        ],
      },
    ],
  },
};

/**
 * Forced-alignment (MMS_FA) VO schedules for Vietnamese renders at 60 fps.
 * Source audio files are kept 100% untouched; animation milestones warp to follow VO onsets,
 * and RMS-matching gains are applied solely via Remotion `<Audio volume>`.
 */
export const VI_VO_SCHEDULES: Record<BoardId, VoBoardSchedule> = {
  Step1: {
    boardId: "Step1",
    filename: "step-1-vi",
    totalFrames: 1047,
    substeps: [
      {
        id: "cans",
        audioFile: "step1-1-cans-vi.mp3",
        audioDurationSec: 4.960,
        startFrame: 0,
        durationInFrames: 310,
        gain: 1.109,
        anchors: [
          [0, 0],
          [67, 12],
          [151, 78],
          [256, 175],
          [310, 270],
        ],
      },
      {
        id: "paper",
        audioFile: "step1-2-paper-vi.mp3",
        audioDurationSec: 6.640,
        startFrame: 310,
        durationInFrames: 411,
        gain: 1.844,
        anchors: [
          [0, 0],
          [61, 16],
          [232, 145],
          [281, 175],
          [374, 256],
          [411, 270],
        ],
      },
      {
        id: "cardboard",
        audioFile: "step1-3-cardboard-vi.mp3",
        audioDurationSec: 5.120,
        startFrame: 721,
        durationInFrames: 326,
        gain: 0.977,
        anchors: [
          [0, 0],
          [52, 12],
          [109, 32],
          [147, 92],
          [193, 132],
          [268, 220],
          [302, 265],
          [326, 270],
        ],
      },
    ],
  },
  Step2: {
    boardId: "Step2",
    filename: "step-2-vi",
    totalFrames: 1313,
    substeps: [
      {
        id: "chop",
        audioFile: "step2-1-chop-vi.mp3",
        audioDurationSec: 5.360,
        startFrame: 0,
        durationInFrames: 334,
        gain: 1.224,
        anchors: [
          [0, 0],
          [101, 16],
          [219, 48],
          [263, 155],
          [295, 210],
          [334, 270],
        ],
      },
      {
        id: "spread",
        audioFile: "step2-2-spread-vi.mp3",
        audioDurationSec: 4.960,
        startFrame: 334,
        durationInFrames: 310,
        gain: 1.559,
        anchors: [
          [0, 0],
          [10, 8],
          [42, 32],
          [187, 156],
          [270, 205],
          [310, 270],
        ],
      },
      {
        id: "bran",
        audioFile: "step2-3-bran-vi.mp3",
        audioDurationSec: 4.880,
        startFrame: 644,
        durationInFrames: 305,
        gain: 1.946,
        anchors: [
          [0, 0],
          [66, 28],
          [171, 108],
          [247, 196],
          [272, 246],
          [305, 270],
        ],
      },
      {
        id: "press",
        audioFile: "step2-4-press-vi.mp3",
        audioDurationSec: 5.760,
        startFrame: 949,
        durationInFrames: 364,
        gain: 1.355,
        anchors: [
          [0, 0],
          [44, 36],
          [119, 112],
          [245, 195],
          [298, 210],
          [334, 245],
          [342, 268],
          [364, 270],
        ],
      },
    ],
  },
  Step3: {
    boardId: "Step3",
    filename: "step-3-vi",
    totalFrames: 950,
    substeps: [
      {
        id: "bag",
        audioFile: "step3-1-bag-vi.mp3",
        audioDurationSec: 4.000,
        startFrame: 0,
        durationInFrames: 252,
        gain: 1.838,
        anchors: [
          [0, 0],
          [8, 14],
          [130, 125],
          [210, 168],
          [252, 270],
        ],
      },
      {
        id: "smooth",
        audioFile: "step3-2-smooth-vi.mp3",
        audioDurationSec: 6.320,
        startFrame: 252,
        durationInFrames: 392,
        gain: 1.416,
        anchors: [
          [0, 0],
          [28, 6],
          [117, 34],
          [189, 102],
          [248, 118],
          [312, 175],
          [360, 220],
          [392, 270],
        ],
      },
      {
        id: "lid",
        audioFile: "step3-3-lid-vi.mp3",
        audioDurationSec: 4.800,
        startFrame: 644,
        durationInFrames: 306,
        gain: 0.889,
        anchors: [
          [0, 0],
          [53, 10],
          [78, 26],
          [104, 82],
          [179, 135],
          [278, 265],
          [306, 270],
        ],
      },
    ],
  },
  Faq1: {
    boardId: "Faq1",
    filename: "faq-1-vi",
    totalFrames: 1217,
    substeps: [
      {
        id: "open",
        audioFile: "faq1-1-open-vi.mp3",
        audioDurationSec: 4.640,
        startFrame: 0,
        durationInFrames: 291,
        gain: 1.703,
        anchors: [
          [0, 0],
          [109, 6],
          [157, 42],
          [179, 58],
          [246, 88],
          [291, 270],
        ],
      },
      {
        id: "em",
        audioFile: "faq1-2-em-vi.mp3",
        audioDurationSec: 5.760,
        startFrame: 291,
        durationInFrames: 358,
        gain: 1.294,
        anchors: [
          [0, 0],
          [50, 28],
          [97, 84],
          [172, 138],
          [249, 196],
          [324, 242],
          [358, 270],
        ],
      },
      {
        id: "press",
        audioFile: "faq1-3-press-vi.mp3",
        audioDurationSec: 2.960,
        startFrame: 649,
        durationInFrames: 190,
        gain: 0.834,
        anchors: [
          [0, 0],
          [29, 34],
          [63, 54],
          [95, 108],
          [139, 152],
          [154, 208],
          [190, 270],
        ],
      },
      {
        id: "seal",
        audioFile: "faq1-4-seal-vi.mp3",
        audioDurationSec: 6.000,
        startFrame: 839,
        durationInFrames: 378,
        gain: 1.262,
        anchors: [
          [0, 0],
          [10, 10],
          [54, 82],
          [153, 162],
          [185, 212],
          [238, 242],
          [350, 266],
          [378, 270],
        ],
      },
    ],
  },
  Faq2: {
    boardId: "Faq2",
    filename: "faq-2-vi",
    totalFrames: 878,
    substeps: [
      {
        id: "cover",
        audioFile: "faq2-1-cover-vi.mp3",
        audioDurationSec: 4.320,
        startFrame: 0,
        durationInFrames: 272,
        gain: 1.302,
        anchors: [
          [0, 0],
          [53, 34],
          [104, 48],
          [189, 145],
          [232, 215],
          [272, 270],
        ],
      },
      {
        id: "bag",
        audioFile: "faq2-2-bag-vi.mp3",
        audioDurationSec: 5.200,
        startFrame: 272,
        durationInFrames: 324,
        gain: 1.050,
        anchors: [
          [0, 0],
          [53, 8],
          [113, 28],
          [195, 150],
          [265, 185],
          [284, 220],
          [324, 270],
        ],
      },
      {
        id: "lid",
        audioFile: "faq2-3-lid-vi.mp3",
        audioDurationSec: 4.400,
        startFrame: 596,
        durationInFrames: 282,
        gain: 1.146,
        anchors: [
          [0, 0],
          [98, 26],
          [131, 80],
          [161, 95],
          [238, 210],
          [258, 265],
          [282, 270],
        ],
      },
    ],
  },
  Faq3: {
    boardId: "Faq3",
    filename: "faq-3-vi",
    totalFrames: 1075,
    substeps: [
      {
        id: "check",
        audioFile: "faq3-1-check-vi.mp3",
        audioDurationSec: 5.760,
        startFrame: 0,
        durationInFrames: 358,
        gain: 1.228,
        anchors: [
          [0, 0],
          [47, 46],
          [159, 108],
          [224, 155],
          [292, 190],
          [358, 270],
        ],
      },
      {
        id: "pour",
        audioFile: "faq3-2-pour-vi.mp3",
        audioDurationSec: 5.840,
        startFrame: 358,
        durationInFrames: 363,
        gain: 1.545,
        anchors: [
          [0, 0],
          [48, 24],
          [158, 68],
          [311, 242],
          [326, 255],
          [363, 270],
        ],
      },
      {
        id: "water",
        audioFile: "faq3-3-water-vi.mp3",
        audioDurationSec: 5.600,
        startFrame: 721,
        durationInFrames: 354,
        gain: 1.233,
        anchors: [
          [0, 0],
          [82, 58],
          [158, 88],
          [298, 210],
          [319, 244],
          [330, 266],
          [354, 270],
        ],
      },
    ],
  },
  Faq4: {
    boardId: "Faq4",
    filename: "faq-4-vi",
    totalFrames: 808,
    substeps: [
      {
        id: "white",
        audioFile: "faq4-1-white-vi.mp3",
        audioDurationSec: 5.760,
        startFrame: 0,
        durationInFrames: 358,
        gain: 0.972,
        anchors: [
          [0, 0],
          [35, 22],
          [224, 150],
          [331, 245],
          [358, 270],
        ],
      },
      {
        id: "dark",
        audioFile: "faq4-2-dark-vi.mp3",
        audioDurationSec: 7.200,
        startFrame: 358,
        durationInFrames: 450,
        gain: 1.097,
        anchors: [
          [0, 0],
          [65, 24],
          [269, 28],
          [354, 140],
          [408, 244],
          [426, 266],
          [450, 270],
        ],
      },
    ],
  },
  Faq5: {
    boardId: "Faq5",
    filename: "faq-5-vi",
    totalFrames: 1204,
    substeps: [
      {
        id: "plant",
        audioFile: "faq5-1-plant-vi.mp3",
        audioDurationSec: 6.000,
        startFrame: 0,
        durationInFrames: 372,
        gain: 1.417,
        anchors: [
          [0, 0],
          [86, 16],
          [157, 48],
          [225, 118],
          [330, 225],
          [372, 270],
        ],
      },
      {
        id: "bin",
        audioFile: "faq5-2-bin-vi.mp3",
        audioDurationSec: 6.800,
        startFrame: 372,
        durationInFrames: 420,
        gain: 1.351,
        anchors: [
          [0, 0],
          [24, 22],
          [201, 28],
          [313, 44],
          [359, 138],
          [396, 182],
          [420, 270],
        ],
      },
      {
        id: "juice",
        audioFile: "faq5-3-juice-vi.mp3",
        audioDurationSec: 6.560,
        startFrame: 792,
        durationInFrames: 412,
        gain: 1.258,
        anchors: [
          [0, 0],
          [79, 24],
          [153, 46],
          [355, 196],
          [380, 244],
          [388, 266],
          [412, 270],
        ],
      },
    ],
  },
};

export const VO_SCHEDULES: Record<BoardLocale, Record<BoardId, VoBoardSchedule>> = {
  vi: VI_VO_SCHEDULES,
  en: EN_VO_SCHEDULES,
};

/**
 * Piecewise-linearly maps a local real frame inside a substep onto canonical [0, 270]
 * using strictly increasing anchor pairs.
 */
export function warpSegmentFrame(
  localRealFrame: number,
  anchors: readonly (readonly [number, number])[],
): number {
  if (anchors.length === 0) return 0;
  const first = anchors[0]!;
  const last = anchors[anchors.length - 1]!;
  if (localRealFrame <= first[0]) return first[1];
  if (localRealFrame >= last[0]) return last[1];

  for (let i = 0; i < anchors.length - 1; i++) {
    const [r0, c0] = anchors[i]!;
    const [r1, c1] = anchors[i + 1]!;
    if (localRealFrame <= r1) {
      const span = r1 - r0;
      const t = span <= 0 ? 1 : (localRealFrame - r0) / span;
      return Math.max(0, Math.min(SUBSTEP_FRAMES, c0 + t * (c1 - c0)));
    }
  }
  return last[1];
}

/**
 * Maps composition frame `rawFrame` to canonical animation frame.
 * When `voiced` is false (silent baseline), returns `rawFrame` verbatim.
 */
export function mapBoardFrame(
  rawFrame: number,
  boardId: BoardId,
  locale: BoardLocale = "vi",
  voiced = false,
): number {
  if (!voiced) return rawFrame;
  const schedule = VO_SCHEDULES[locale][boardId];
  const subs = schedule.substeps;
  if (subs.length === 0) return rawFrame;

  let activeIdx = 0;
  for (let i = 0; i < subs.length; i++) {
    if (rawFrame >= subs[i]!.startFrame) {
      activeIdx = i;
    } else {
      break;
    }
  }
  const sub = subs[activeIdx]!;
  const localReal = rawFrame - sub.startFrame;
  return activeIdx * SUBSTEP_FRAMES + warpSegmentFrame(localReal, sub.anchors);
}

/** Validates that every substep schedule is contiguous and strictly monotonic on both axes. */
export function assertValidSchedules(): void {
  for (const [locale, boards] of Object.entries(VO_SCHEDULES)) {
    for (const board of Object.values(boards)) {
      let cursor = 0;
      for (const sub of board.substeps) {
        if (sub.startFrame !== cursor) {
          throw new Error(`${locale}/${board.boardId}.${sub.id}: startFrame ${sub.startFrame} != ${cursor}`);
        }
        if (sub.anchors.length < 2) {
          throw new Error(`${locale}/${board.boardId}.${sub.id}: expected >= 2 anchors`);
        }
        const first = sub.anchors[0]!;
        const last = sub.anchors[sub.anchors.length - 1]!;
        if (first[0] !== 0 || first[1] !== 0) {
          throw new Error(`${locale}/${board.boardId}.${sub.id}: first anchor must be [0, 0]`);
        }
        if (last[0] !== sub.durationInFrames || last[1] !== SUBSTEP_FRAMES) {
          throw new Error(
            `${locale}/${board.boardId}.${sub.id}: last anchor [${last[0]}, ${last[1]}] != [${sub.durationInFrames}, ${SUBSTEP_FRAMES}]`,
          );
        }
        for (let i = 1; i < sub.anchors.length; i++) {
          const [pr, pc] = sub.anchors[i - 1]!;
          const [nr, nc] = sub.anchors[i]!;
          if (nr <= pr || nc <= pc) {
            throw new Error(
              `${locale}/${board.boardId}.${sub.id}: non-monotonic anchor [${pr},${pc}] -> [${nr},${nc}]`,
            );
          }
        }
        cursor += sub.durationInFrames;
      }
      if (cursor !== board.totalFrames) {
        throw new Error(
          `${locale}/${board.boardId}: sum of substep durations ${cursor} != totalFrames ${board.totalFrames}`,
        );
      }
    }
  }
}
