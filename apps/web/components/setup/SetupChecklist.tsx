import { Card, NumberBadge, Pill } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SetupStep } from "@/content/types";

/**
 * Mobile checklist card: title + badge pill, description, rows whose
 * NumberBadge state follows the active sub-step, and the optional info tiles.
 */
export function SetupChecklist({ step, active }: { step: SetupStep; active: number }) {
  return (
    <Card as="article" className="mx-4 mt-3 flex flex-col gap-3 lg:hidden">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="m-0 text-lg font-bold leading-6">{step.title}</h1>
          {step.badge && <Pill tone="brown" className="flex-none px-2.5 py-1">{step.badge}</Pill>}
        </div>
        {step.description && <p className="m-0 text-[13px] leading-[18px] text-bk-muted">{step.description}</p>}
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {step.substeps.map((s, i) => {
          const state = i < active ? "done" : i === active ? "current" : "upcoming";
          return (
            <li
              key={s.id}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex items-start gap-2.5 text-sm leading-5",
                state === "done" && "text-bk-muted",
                state === "current" && "-mx-2 rounded-bk-sm bg-bk-accent-tint p-2 font-semibold",
              )}
            >
              <NumberBadge number={i + 1} state={state} />
              {s.checklist}
            </li>
          );
        })}
      </ol>
      {step.infoTiles && (
        <div className="flex gap-2">
          {step.infoTiles.map((t) => (
            <div
              key={t.title}
              className={cn(
                "flex flex-1 flex-col gap-0.5 rounded-bk-sm px-2.5 py-2",
                t.tone === "dark" ? "bg-bk-primary-dark text-white" : "bg-[#F3F6EF] text-bk-illo-label",
              )}
            >
              <span className={cn("flex items-center gap-1 text-xs font-bold", t.tone === "light" && "text-bk-primary-dark")}>
                {t.icon === "lock" && <LockIcon size={13} />}
                {t.title}
              </span>
              <span className="text-xs leading-4">{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LockIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
