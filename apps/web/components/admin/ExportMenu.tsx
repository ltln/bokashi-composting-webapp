"use client";

import { useEffect, useId, useRef, useState } from "react";
import { admin } from "@/content/admin";

const item =
  "flex min-h-touch w-full items-center gap-2 rounded-[10px] border-0 bg-transparent px-3 text-left text-sm font-semibold text-bk-ink no-underline hover:bg-bk-ground hover:text-bk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-bk-primary disabled:opacity-60";

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/**
 * "Xuất báo cáo": a disclosure with the raw logs CSV and the PNG of the pages
 * chart. Closes on Escape, on an outside click and after a choice.
 */
export function ExportMenu({ csvHref, onPng, pngDisabled }: { csvHref: string; onPng: () => void; pngDisabled: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-touch items-center gap-2 rounded-bk-sm border border-bk-border bg-bk-surface px-3.5 text-[13px] font-semibold text-bk-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
      >
        <Icon d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        {admin.export.button}
      </button>
      {open && (
        <ul
          id={id}
          className="absolute right-0 top-full z-10 m-0 mt-1.5 flex w-max min-w-[240px] list-none flex-col gap-0.5 rounded-bk-md border border-bk-border bg-bk-surface p-1.5 shadow-lg"
        >
          <li>
            <a href={csvHref} download className={item} onClick={() => setOpen(false)}>
              <Icon d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h8" />
              {admin.export.csv}
            </a>
          </li>
          <li>
            <button
              type="button"
              className={item}
              disabled={pngDisabled}
              onClick={() => {
                setOpen(false);
                onPng();
              }}
            >
              <Icon d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
              {admin.export.png}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
