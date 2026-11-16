import { cn } from "@/lib/cn";

export interface SegmentedProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** "solid" fills the active option with the primary color (range); "tint" is the quieter device style. */
  tone?: "solid" | "tint";
}

/** Segmented control: a group of toggle buttons, the active one has aria-pressed="true". */
export function Segmented<T extends string>({ label, options, value, onChange, tone = "solid" }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap gap-[3px] rounded-bk-sm border border-bk-border bg-bk-surface p-[3px]"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-touch rounded-[9px] px-3.5 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary",
              active
                ? tone === "solid"
                  ? "bg-bk-primary text-white"
                  : "bg-bk-nav-active text-bk-primary-dark"
                : "bg-transparent text-bk-ink hover:bg-bk-ground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
