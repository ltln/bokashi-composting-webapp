import { cn } from "@/lib/cn";

export interface SegmentProgressProps {
  /** Number of segments (sub-steps). */
  total: number;
  /** 0-based index of the active segment. Segments before it render full. */
  current: number;
  /** Fill of the active segment, 0..1. Default 0. */
  progress?: number;
  /** Accessible name, e.g. "Tiến độ bước 1" (from content/). */
  "aria-label"?: string;
  className?: string;
}

/**
 * Segmented progress bar (player controls). Done segments are primary, the
 * active one fills orange, upcoming are border-grey. The fill uses scaleX so
 * only `transform` changes while it advances.
 */
export function SegmentProgress({ total, current, progress = 0, className, ...aria }: SegmentProgressProps) {
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(total, current + p)}
      aria-label={aria["aria-label"]}
      className={cn("flex flex-1 items-center gap-1", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={cn("h-1.5 flex-1 overflow-hidden rounded-[3px]", i < current ? "bg-bk-primary" : "bg-bk-border")}>
          {i === current && (
            <div className="h-full w-full origin-left bg-bk-accent" style={{ transform: `scaleX(${p})` }} />
          )}
        </div>
      ))}
    </div>
  );
}
