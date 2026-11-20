import { Audio, Sequence, staticFile } from "remotion";
import type { BoardId } from "../timeline";
import { VO_SCHEDULES, type BoardLocale } from "../voAlignment";

/**
 * Plays untouched per-substep voiceover clips directly from `public/audio/<locale>/`
 * at their scheduled start frames with optional RMS-matched playback gain.
 */
export function VoAudioTrack({
  boardId,
  locale,
  voiced = false,
}: {
  boardId: BoardId;
  locale: BoardLocale;
  voiced?: boolean;
}) {
  if (!voiced) return null;
  const schedule = VO_SCHEDULES[locale][boardId];

  return (
    <>
      {schedule.substeps.map((sub) => (
        <Sequence
          key={sub.id}
          name={sub.id}
          layout="none"
          from={sub.startFrame}
          durationInFrames={sub.durationInFrames}
        >
          <Audio
            src={staticFile(`audio/${locale}/${sub.audioFile}`)}
            volume={sub.gain ?? 1}
            allowAmplificationDuringRender
          />
        </Sequence>
      ))}
    </>
  );
}
